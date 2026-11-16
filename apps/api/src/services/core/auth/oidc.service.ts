import type { LoginMeta, SignInAttempt } from './authentication.service';
import type { Tokens } from './jwt.service';
import type { IoC } from '@intake24/api/ioc';

import * as oidc from 'openid-client';

import { UnauthorizedError } from '@intake24/api/http/errors';
import { btoa } from '@intake24/api/util';
import { createAmrMethod } from '@intake24/common/security';
import { normalizedEmail } from '@intake24/common/types';
import { User, UserIdentity } from '@intake24/db';

function oidcService({
  aclConfig,
  appConfig,
  adminSignupService,
  db,
  jwtService,
  logger: globalLogger,
  signInService,
  servicesConfig,
}: Pick<
  IoC,
  'aclConfig' | 'appConfig' | 'adminSignupService' | 'db' | 'jwtService' | 'logger' | 'signInService' | 'servicesConfig'
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
      if (!claims)
        throw new Error('Missing ID token claims');

      const { iss: issuer, sub: subject, email: emailClaim, email_verified, name } = claims;
      const userAttributes = [
        'id',
        'email',
        'verifiedAt',
        'disabledAt',
      ] as const;

      const identity = await UserIdentity.findOne({
        attributes: ['id'],
        where: { issuer, subject },
        include: [
          {
            association: 'user',
            attributes: [...userAttributes],
            required: true,
          },
        ],
      });

      let user = identity?.user;
      if (!user) {
        // Email only proposes the link on first sign-in; afterwards iss + sub identify the user.
        if (email_verified !== true)
          throw new Error('Unverified email cannot link an account');

        const email = normalizedEmail.parse(emailClaim);

        user = await User.findOne({
          attributes: [...userAttributes],
          where: { email },
        }) ?? undefined;
        if (!user && aclConfig.signup.enabled) {
          user = await adminSignupService.signUp(
            {
              name: name?.toString(),
              email,
              password: undefined,
              verifiedAt: new Date(),
            },
            { notify: false, userAgent },
          );
        }

        if (!user)
          throw new Error('User not found');
      }

      signInAttempt.userId = user.id;

      if (user.isDisabled())
        throw new Error('Account is disabled');

      if (!identity) {
        // A new subject with a known email is a reassigned address, not the same person.
        if (await UserIdentity.findOne({
          attributes: ['id'],
          where: { userId: user.id, issuer },
        })) {
          throw new Error('Account is already linked to another identity from this issuer');
        }

        await db.system.transaction(async (transaction) => {
          await UserIdentity.create({ userId: user.id, issuer, subject }, { transaction });

          if (!user.isVerified()) {
            await user.update({
              verifiedAt: new Date(),
            }, { transaction });
          }
        });
      }

      if (!user.email)
        throw new Error('Account has no email');

      const [tokens] = await Promise.all([
        jwtService.issueTokens(
          {
            userId: user.id,
            verified: user.isVerified(),
            aal: 'aal2',
            amr: [
              createAmrMethod('oidc'),
            ],
          },
          'admin',
          {
            subject: btoa({ provider: 'oidc', providerKey: user.email }),
          },
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
