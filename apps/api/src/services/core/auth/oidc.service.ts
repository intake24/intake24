import type { LoginMeta, SignInAttempt } from './authentication.service';
import type { Tokens } from './jwt.service';
import type { IoC } from '@intake24/api/ioc';

import * as oidc from 'openid-client';
import { Op } from 'sequelize';

import { UnauthorizedError } from '@intake24/api/http/errors';
import { btoa } from '@intake24/api/util';
import { createAmrMethod } from '@intake24/common/security';
import { User } from '@intake24/db';

function oidcService({
  aclConfig,
  appConfig,
  adminSignupService,
  jwtService,
  logger: globalLogger,
  signInService,
  servicesConfig,
}: Pick<
  IoC,
  'aclConfig' | 'appConfig' | 'adminSignupService' | 'jwtService' | 'logger' | 'signInService' | 'servicesConfig'
>) {
  const logger = globalLogger.child({ service: 'OIDCService' });

  const oidcConfigs: Record<string, oidc.Configuration> = {};

  async function getOidcConfigs(provider: string) {
    if (!servicesConfig.oidc[provider])
      throw new UnauthorizedError('Invalid OIDC provider');

    const { admin: redirectUrl } = appConfig.urls;
    const { issuer, clientId, clientSecret } = servicesConfig.oidc[provider];

    if (oidcConfigs[provider])
      return { config: oidcConfigs[provider], redirectUrl };

    oidcConfigs[provider] = await oidc.discovery(new URL(issuer), clientId, clientSecret);

    return { config: oidcConfigs[provider], redirectUrl };
  }

  const redirect = async (provider: string, meta: LoginMeta): Promise<string> => {
    const { config, redirectUrl } = await getOidcConfigs(provider);

    const pkce = oidc.randomPKCECodeVerifier();
    let nonce: string | undefined;

    const params: Record<string, string> = {
      redirect_uri: new URL(`oidc/${provider}`, redirectUrl).href,
      scope: 'openid email profile',
      code_challenge: await oidc.calculatePKCECodeChallenge(pkce),
      code_challenge_method: 'S256',
    };

    if (!config.serverMetadata().supportsPKCE()) {
      nonce = oidc.randomNonce();
      params.nonce = nonce;
    }

    meta.req.session.oidc = { provider, pkce, nonce };
    return oidc.buildAuthorizationUrl(config, params).href;
  };

  const callback = async (provider: string, url: string, meta: LoginMeta): Promise<Tokens> => {
    const { req: { ip: remoteAddress }, userAgent } = meta;

    const signInAttempt: SignInAttempt = {
      provider: 'oidc',
      providerKey: provider,
      remoteAddress,
      userAgent,
      successful: false,
    };

    try {
      if (!servicesConfig.oidc[provider])
        throw new Error('Invalid OIDC provider');

      if (!meta.req.session.oidc)
        throw new Error('Missing OIDC callback session data');

      if (meta.req.session.oidc.provider !== provider)
        throw new Error('OIDC provider mismatch in callback session data');

      const { pkce, nonce } = meta.req.session.oidc;

      const { config, redirectUrl } = await getOidcConfigs(provider);

      const oidcTokens = await oidc.authorizationCodeGrant(config, new URL(url, redirectUrl), {
        pkceCodeVerifier: pkce,
        expectedNonce: nonce,
        idTokenExpected: true,
      });

      const claims = oidcTokens.claims();
      if (!claims?.email)
        throw new Error('Missing ID token claims');

      const { email, email_verified, name } = claims;

      let user = await User.findOne({ attributes: ['id', 'verifiedAt'], where: { email: { [Op.iLike]: email.toString() } } });
      if (!user && aclConfig.signup.enabled) {
        user = await adminSignupService.signUp(
          {
            name: name?.toString(),
            email: email.toString(),
            password: undefined,
            verifiedAt: email_verified === true ? new Date() : null,
          },
          { notify: email_verified !== true, userAgent },
        );
      }

      if (!user)
        throw new Error('User not found');

      if (!user.verifiedAt && email_verified === true)
        await user.update({ verifiedAt: new Date() });

      const [tokens] = await Promise.all([
        jwtService.issueTokens(
          {
            userId: user.id,
            verified: email_verified === true,
            aal: 'aal2',
            amr: [createAmrMethod('oidc')],
          },
          'admin',
          { subject: btoa({ provider: 'oidc', providerKey: email }) },
        ),
        signInService.log({ ...signInAttempt, successful: true }),
      ]);

      return tokens;
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.debug(`${name}: ${message}`, { stack });
        await signInService.log({ ...signInAttempt, message });
      }

      throw new UnauthorizedError('OIDC callback failed');
    }
    finally {
      delete meta.req.session.oidc;
    }
  };

  return {
    redirect,
    callback,
  };
}

export default oidcService;

export type OIDCService = ReturnType<typeof oidcService>;
