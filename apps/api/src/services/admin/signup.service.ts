import type { CreateUserOptions } from './user.service';
import type { IoC } from '@intake24/api/ioc';
import type { UserInput } from '@intake24/common/types/http/admin';

import { ForbiddenError, ValidationError } from '@intake24/api/http/errors';
import { Permission, Role, User } from '@intake24/db';

function adminSignupService({
  aclConfig,
  appConfig,
  securityConfig,
  adminUserService,
  jwtService,
  logger: globalLogger,
}: Pick<
  IoC,
  'adminUserService' | 'aclConfig' | 'appConfig' | 'jwtService' | 'logger' | 'securityConfig'
>) {
  const logger = globalLogger.child({ service: 'AdminSignupService' });

  /**
   * Create user verification token
   *
   * @param {string} userId
   * @returns
   */
  const createVerificationToken = async (userId: string) => {
    const { expiresIn } = securityConfig.passwords;

    const token = await jwtService.sign({ userId }, appConfig.secret, {
      expiresIn,
      audience: ['admin'],
    });

    return { token, expiresIn };
  };

  /**
   * Admin tool signup - create new user with researcher role
   *
   * @param {UserInput} input
   * @param {CreateUserOptions} [options]
   * @returns {Promise<User>}
   */
  const signUp = async (input: UserInput, options: CreateUserOptions = {}): Promise<User> => {
    const { enabled, permissions: permissionNames, roles: roleNames } = aclConfig.signup;

    if (!enabled)
      throw new ForbiddenError();

    const [permissionRecords, roleRecords] = await Promise.all([
      Permission.findAll({ attributes: ['id'], where: { name: permissionNames } }),
      Role.findAll({ attributes: ['id'], where: { name: roleNames } }),
    ]);

    const permissions = permissionRecords.map(({ id }) => id);
    const roles = roleRecords.map(({ id }) => id);

    return adminUserService.create({ ...input, permissions, roles }, options);
  };

  const verify = async (token: string) => {
    try {
      const { userId } = await jwtService.verify(token, appConfig.secret);
      const user = await User.findOne({ where: { id: userId } });
      if (!user)
        throw new Error(`User not found: ${userId}.`);

      if (!user.isVerified())
        await user.update({ verifiedAt: new Date() });
    }
    catch (err) {
      if (err instanceof Error) {
        const { message, name, stack } = err;
        logger.debug(`${name}: ${message}`, { stack });
      }

      throw new ValidationError('Invalid token', { path: 'token' });
    }
  };

  return {
    createVerificationToken,
    signUp,
    verify,
  };
}

export default adminSignupService;

export type AdminSignupService = ReturnType<typeof adminSignupService>;
