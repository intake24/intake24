import type { Request } from 'express';
import type { Tokens } from './jwt.service';
import { NotFoundError, UnauthorizedError } from '@intake24/api/http/errors';
import { captcha as captchaCheck } from '@intake24/api/http/rules';
import type { IoC } from '@intake24/api/ioc';
import { btoa } from '@intake24/api/util';
import { supportedAlgorithms } from '@intake24/common-backend';
import type { Subject } from '@intake24/common/security';
import { createAmrMethod, surveyRespondent } from '@intake24/common/security';
import type { FrontEnd } from '@intake24/common/types';
import type {
  AliasLoginRequest,
  ChallengeResponse,
  EmailLoginRequest,
  LoginRequest,
  MFAChallengeRequest,
  MFAChallengeResponse,
  MFAVerificationRequest,
  TokenLoginRequest,
} from '@intake24/common/types/http';
import type { SurveyAttributes, UserPassword } from '@intake24/db';
import { MFADevice, Survey, User } from '@intake24/db';

export type LoginCredentials<T extends FrontEnd = FrontEnd> = {
  user: User | null;
  password: string;
  captcha?: string;
  subject: Subject;
  frontEnd: T;
  survey?: Pick<SurveyAttributes, 'slug' | 'authCaptcha'>;
};

export type LoginMeta = {
  req: Request;
  userAgent?: string;
};

export interface SignInAttempt extends Subject {
  userId?: string;
  remoteAddress?: string;
  userAgent?: string;
  successful: boolean;
  message?: string;
}

export type MFALoginCredentials = {
  userId: string;
  device: MFADevice;
};

function authenticationService({
  aclCache,
  jwtRotationService,
  jwtService,
  logger: globalLogger,
  signInService,
  duoProvider,
  otpProvider,
  fidoProvider,
  servicesConfig,
}: Pick<
  IoC,
  | 'aclCache'
  | 'jwtRotationService'
  | 'jwtService'
  | 'logger'
  | 'signInService'
  | 'duoProvider'
  | 'otpProvider'
  | 'fidoProvider'
  | 'servicesConfig'
>) {
  const logger = globalLogger.child({ service: 'AuthenticationService' });

  /**
   * Login helper to verify user's password
   *
   * Tries to find the password hashing algorithm from user_passwords.passwordHasher column. If a
   * supported algorithm is found, computes and compares the supplied password's hash; raises an
   * error otherwise.
   *
   * @param {string} password
   * @param {UserPassword} [userPassword]
   * @returns {Promise<boolean>}
   */
  const verifyPassword = async (
    password: string,
    userPassword?: UserPassword,
  ): Promise<boolean> => {
    if (!userPassword)
      throw new Error('Password login not enabled for this user.');

    const { passwordHasher, passwordSalt, passwordHash } = userPassword;

    const algorithm = supportedAlgorithms.find(a => a.id === passwordHasher);
    if (!algorithm)
      throw new Error(`Password algorithm '${passwordHasher}' not supported.`);

    return algorithm.verify(password, { salt: passwordSalt, hash: passwordHash });
  };

  /**
   * Create new MFA challenge
   *
   * @param {{ userId: string; deviceId?: string }} credentials
   * @param {LoginMeta} meta
   * @returns {Promise<MFAChallengeResponse>}
   */
  const createMFAChallenge = async (credentials: { userId: string; deviceId?: string }, meta: LoginMeta): Promise<MFAChallengeResponse> => {
    const { userId } = credentials;
    const devices = await MFADevice.findAll({
      where: { userId },
      include: [
        {
          association: 'authenticator',
          attributes: ['id', 'transports'],
        },
        {
          association: 'user',
          attributes: ['id', 'email'],
        },
      ],
      order: [
        ['preferred', 'DESC'],
        ['id', 'ASC'],
      ],
    });

    const device = credentials.deviceId ? devices.find(d => d.id === credentials.deviceId) : devices.at(0);
    if (!device)
      throw new NotFoundError('No MFA devices found.');

    const { id: deviceId, provider } = device;
    const providers = { duo: duoProvider, otp: otpProvider, fido: fidoProvider };

    const challenge = await providers[provider].authenticationChallenge(device);

    const { challengeId } = challenge;
    meta.req.session.mfaAuthChallenge = {
      challengeId,
      deviceId,
      provider,
      userId,
      amr: credentials.deviceId && meta.req.session.mfaAuthChallenge?.amr ? meta.req.session.mfaAuthChallenge.amr : [createAmrMethod('pwd')],
    };

    return { challenge, devices };
  };

  /**
   * Process MFA authentication challenge
   *
   * @param {{ userId: string; email: string }} credentials
   * @param {LoginMeta} meta
   * @returns {Promise<MFAChallengeResponse>}
   */
  const processMFA = async (
    credentials: { userId: string; email: string },
    meta: LoginMeta,
  ): Promise<MFAChallengeResponse> => {
    const { userId, email } = credentials;
    const { req: { ip: remoteAddress }, userAgent } = meta;

    const signInAttempt: SignInAttempt = {
      provider: 'email',
      providerKey: email,
      userId,
      remoteAddress,
      userAgent,
      successful: false,
    };

    try {
      const { challenge, devices } = await createMFAChallenge(credentials, meta);
      await signInService.log({ ...signInAttempt, successful: true });

      return { challenge, devices };
    }
    catch (err) {
      if (err instanceof Error) {
        await signInService.log({ ...signInAttempt, message: err.message });
        throw new UnauthorizedError(err.message);
      }

      throw new UnauthorizedError();
    }
  };

  /**
   * Login helper with common login logic
   *
   * @param {LoginCredentials} credentials
   * @param {LoginMeta} meta
   * @returns {Promise<Tokens | MFAChallengeResponse>}
   */
  const processLogin = async <T extends FrontEnd>(
    credentials: LoginCredentials<T>,
    meta: LoginMeta,
  ): Promise<T extends 'survey' ? ChallengeResponse | Tokens : MFAChallengeResponse | Tokens> => {
    const { user, password, captcha, subject, frontEnd, survey } = credentials;
    const { req: { ip: remoteAddress }, userAgent } = meta;

    const signInAttempt: SignInAttempt = {
      ...subject,
      userId: user?.id,
      remoteAddress,
      userAgent,
      successful: false,
    };

    if (!user) {
      await signInService.log({ ...signInAttempt, message: 'Credentials not found in database.' });
      throw new UnauthorizedError('Provided credentials do not match our records.');
    }

    if (user.isDisabled()) {
      await signInService.log({ ...signInAttempt, message: 'Account is disabled.' });
      throw new UnauthorizedError('Account is disabled.');
    }

    if (subject.provider !== 'URLToken' && !(await verifyPassword(password, user.password))) {
      await signInService.log({ ...signInAttempt, message: 'Credentials do not match.' });
      throw new UnauthorizedError('Provided credentials do not match our records.');
    }

    const { id: userId, email, verifiedAt } = user;
    const surveyId = survey?.slug;
    const authCaptcha = survey?.authCaptcha;
    const permissions = user.permissions?.map(({ name }) => name);

    if (frontEnd === 'survey') {
      if (!surveyId || authCaptcha === undefined) {
        await signInService.log({
          ...signInAttempt,
          message: 'Invalid survey for provided credentials.',
        });
        throw new UnauthorizedError('Provided credentials do not match our records.');
      }

      if (!permissions?.includes(surveyRespondent(surveyId))) {
        await signInService.log({
          ...signInAttempt,
          message: `Missing permission for survey access (${surveyId}).`,
        });
        throw new UnauthorizedError('Missing permission for survey access.');
      }

      if (authCaptcha) {
        try {
          if (typeof captcha === 'undefined')
            // @ts-expect-error fix type
            return { surveyId, provider: 'captcha' };
          else await captchaCheck(captcha, servicesConfig.captcha);
        }
        catch {
          await signInService.log({ ...signInAttempt, message: `Invalid CAPTCHA challenge.` });
          throw new UnauthorizedError('Invalid CAPTCHA challenge.');
        }
      }
    }

    if (frontEnd === 'admin' && user.multiFactorAuthentication && email)
      // @ts-expect-error fix type
      return processMFA({ email, userId }, meta);

    await signInService.log({ ...signInAttempt, successful: true });

    return jwtService.issueTokens(
      { surveyId, userId, verified: !!verifiedAt, permissions },
      frontEnd,
      { subject: btoa(subject) },
    );
  };

  /**
   * Email login to admin application
   *
   * @param {LoginRequest} credentials
   * @param {LoginMeta} meta
   * @returns {(Promise<Tokens | MFAChallengeResponse>)}
   */
  const adminLogin = async (
    credentials: LoginRequest,
    meta: LoginMeta,
  ): Promise<Tokens | MFAChallengeResponse> => {
    const { email, password } = credentials;

    const user = await User.findOne({
      where: { email: { [User.op('ciEq')]: email } },
      include: [{ association: 'password', required: true }],
    });

    const subject: Subject = { provider: 'email', providerKey: email };

    return processLogin({ user, password, subject, frontEnd: 'admin' }, meta);
  };

  /**
   * Email login to respondent application
   *
   * @param {EmailLoginRequest} credentials
   * @param {LoginMeta} meta
   * @returns {Promise<ChallengeResponse | Tokens>}
   */
  const emailLogin = async (
    credentials: EmailLoginRequest,
    meta: LoginMeta,
  ): Promise<ChallengeResponse | Tokens> => {
    const { email, password, survey: slug, captcha } = credentials;

    const [user, survey] = await Promise.all([
      User.findOne({
        where: { email: { [User.op('ciEq')]: email } },
        include: [
          { association: 'password', required: true },
          {
            association: 'permissions',
            attributes: ['name'],
            through: { attributes: [] },
            where: { name: surveyRespondent(slug) },
          },
        ],
      }),
      Survey.findBySlug(slug, { attributes: ['authCaptcha', 'slug'] }),
    ]);

    const subject: Subject = { provider: 'email', providerKey: email };

    return processLogin(
      { user, password, captcha, subject, frontEnd: 'survey', survey: survey ?? undefined },
      meta,
    );
  };

  /**
   * Survey alias login to respondent application
   *
   * @param {AliasLoginRequest} credentials
   * @param {LoginMeta} meta
   * @returns {Promise<ChallengeResponse | Tokens>}
   */
  const aliasLogin = async (
    credentials: AliasLoginRequest,
    meta: LoginMeta,
  ): Promise<ChallengeResponse | Tokens> => {
    const { username, password, survey: slug, captcha } = credentials;

    const user = await User.findOne({
      subQuery: false,
      include: [
        {
          association: 'aliases',
          where: { username },
          include: [
            {
              association: 'survey',
              attributes: ['authCaptcha', 'slug'],
              where: { slug: { [User.op('ciEq')]: slug } },
            },
          ],
        },
        { association: 'password' },
        {
          association: 'permissions',
          attributes: ['name'],
          through: { attributes: [] },
          where: { name: surveyRespondent(slug) },
        },
      ],
    });

    const subject: Subject = { provider: 'surveyAlias', providerKey: `${slug}#${username}` };

    return processLogin(
      { user, password, captcha, subject, frontEnd: 'survey', survey: user?.aliases?.at(0)?.survey },
      meta,
    );
  };

  /**
   * URL-embedded token login to respondent application
   *
   * @param {TokenLoginRequest} credentials
   * @param {LoginMeta} meta
   * @returns {Promise<ChallengeResponse | Tokens>}
   */
  const tokenLogin = async (
    { token, captcha }: TokenLoginRequest,
    meta: LoginMeta,
  ): Promise<ChallengeResponse | Tokens> => {
    const user = await User.findOne({
      subQuery: false,
      include: [
        {
          association: 'aliases',
          where: { urlAuthToken: token },
          include: [{ association: 'survey', attributes: ['authCaptcha', 'slug'], required: true }],
        },
        { association: 'password' },
        {
          association: 'permissions',
          attributes: ['name'],
          through: { attributes: [] },
        },
      ],
    });

    const subject: Subject = { provider: 'URLToken', providerKey: token };

    return processLogin(
      {
        user,
        password: '',
        captcha,
        subject,
        frontEnd: 'survey',
        survey: user?.aliases?.at(0)?.survey,
      },
      meta,
    );
  };

  /**
   * Issue new access token using refresh token
   *
   * @param {string} token
   * @param {FrontEnd} frontEnd
   * @returns {Promise<Tokens>}
   */
  const refresh = async (token: string, frontEnd: FrontEnd): Promise<Tokens> => {
    try {
      const {
        userId,
        sub: subject,
        // @ts-expect-error - TS does not narrow down surveyId based on above condition
        surveyId,
        aal,
        amr,
      } = await jwtService.verifyRefreshToken(token, frontEnd);

      const user = await User.findOne({
        attributes: ['id', 'verifiedAt'],
        where: { id: userId, disabledAt: null },
      });
      if (!user)
        throw new UnauthorizedError();

      const valid = await jwtRotationService.verifyAndRevoke(token);
      if (!valid)
        throw new UnauthorizedError();

      // Packing only permissions for survey front-end -> extend to admin (consider jwt payload size)
      const permissions = frontEnd === 'survey' ? await aclCache.getPermissions(userId) : undefined;

      return await jwtService.issueTokens(
        { surveyId, userId, verified: !!user.verifiedAt, permissions, aal, amr },
        frontEnd,
        { subject },
      );
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.error(`${name}: ${message}`, { stack });
      }
      else {
        logger.error(err);
      }

      throw new UnauthorizedError();
    }
  };

  /**
   * Generate MFA authentication challenge
   *
   * @param {MFAChallengeRequest} body
   * @param {LoginMeta} meta
   * @returns {Promise<MFAChallengeResponse>}
   */
  const challenge = async (body: MFAChallengeRequest, meta: LoginMeta): Promise<MFAChallengeResponse> => {
    const { mfaAuthChallenge: { challengeId, userId } = {} } = meta.req.session;
    if (challengeId !== body.challengeId || userId !== body.userId)
      throw new UnauthorizedError('Invalid MFA authentication challenge session.');

    try {
      const { deviceId } = body;
      return await createMFAChallenge({ userId, deviceId }, meta);
    }
    catch (err) {
      throw new UnauthorizedError(err instanceof Error ? err.message : undefined);
    }
  };

  /**
   * Verify MFA authentication response
   *
   * @param {MFAVerificationRequest} body
   * @param {LoginMeta} meta
   * @returns {Promise<Tokens>}
   */
  const verify = async (body: MFAVerificationRequest, meta: LoginMeta): Promise<Tokens> => {
    const { req: { ip: remoteAddress, session: { mfaAuthChallenge } }, userAgent } = meta;

    const signInAttempt: SignInAttempt = {
      provider: mfaAuthChallenge?.provider ?? body.provider,
      providerKey: body.provider === 'fido' ? body.response.id : body.token,
      userId: mfaAuthChallenge?.userId,
      remoteAddress,
      userAgent,
      successful: false,
    };

    try {
      if (!mfaAuthChallenge?.challengeId) {
        await signInService.log({ ...signInAttempt, message: 'MFA: missing / invalid session.' });
        throw new UnauthorizedError();
      }

      const { provider } = body;

      if (provider !== mfaAuthChallenge.provider) {
        await signInService.log({
          ...signInAttempt,
          message: 'MFA: Provider mismatch in challenge and response.',
        });
        throw new UnauthorizedError();
      }

      const { challengeId, deviceId, userId } = mfaAuthChallenge;
      signInAttempt.userId = userId;

      const device = await MFADevice.findOne({
        attributes: ['id', 'secret'],
        where: { id: deviceId, provider, userId },
        include: [
          { association: 'user', attributes: ['id', 'email', 'verifiedAt'], required: true },
          { association: 'authenticator' },
        ],
      });

      if (!device || !device.user?.email || (provider === 'fido' && !device.authenticator)) {
        await signInService.log({
          ...signInAttempt,
          message: 'MFA: No device with corresponding credentials found.',
        });
        throw new UnauthorizedError();
      }

      const {
        authenticator,
        user: { email, verifiedAt },
        secret,
      } = device;

      switch (provider) {
        case 'duo':
          await duoProvider.authenticationVerification({ email, token: body.token });
          break;
        case 'fido':
          if (!authenticator)
            throw new UnauthorizedError();

          await fidoProvider.authenticationVerification({
            authenticator,
            challengeId,
            response: body.response,
          });
          break;
        case 'otp':
          await otpProvider.authenticationVerification({
            email,
            token: body.token,
            secret,
          });
          break;
        default:
          throw new UnauthorizedError();
      }

      const amr = [...mfaAuthChallenge.amr, createAmrMethod(provider)];

      const [tokens] = await Promise.all([
        jwtService.issueTokens({ userId, verified: !!verifiedAt, aal: 'aal2', amr }, 'admin', {
          subject: btoa({ provider: 'email', providerKey: email }),
        }),
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

      throw new UnauthorizedError();
    }
    finally {
      delete meta.req.session.mfaAuthChallenge;
    }
  };

  return {
    verifyPassword,
    adminLogin,
    emailLogin,
    aliasLogin,
    tokenLogin,
    refresh,
    challenge,
    verify,
  };
}

export default authenticationService;

export type AuthenticationService = ReturnType<typeof authenticationService>;
