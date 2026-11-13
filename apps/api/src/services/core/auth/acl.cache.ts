import type { IoC } from '@intake24/api/ioc';
import type { SecurableType } from '@intake24/common/security';
import type { Role } from '@intake24/db';

import { Op } from 'sequelize';

import { ACL_PAT_KEY, ACL_PERMISSIONS_KEY, ACL_ROLES_KEY, securableTypes } from '@intake24/common/security';
import { securableToResource } from '@intake24/common/util';
import { PersonalAccessToken, User } from '@intake24/db';

function aclCache({ aclConfig, cache, kyselyDb }: Pick<IoC, 'aclConfig' | 'cache' | 'kyselyDb'>) {
  const { enabled, ttl } = aclConfig.cache;

  /**
   * Resource permissions implied by securable access to, or ownership of, at least one record of the type
   */
  const fetchSecurableResources = async (userId: string): Promise<string[]> => {
    const [securables, owned] = await Promise.all([
      kyselyDb.system
        .selectFrom('userSecurables')
        .select('userSecurables.securableType')
        .distinct()
        .where('userSecurables.userId', '=', userId)
        .execute(),
      kyselyDb.system
        .selectNoFrom(eb => [
          eb.exists(eb.selectFrom('faqs').select('faqs.id').where('faqs.ownerId', '=', userId)).as('faq'),
          eb.exists(eb.selectFrom('feedbackSchemes').select('feedbackSchemes.id').where('feedbackSchemes.ownerId', '=', userId)).as('feedbackScheme'),
          eb.exists(eb.selectFrom('languages').select('languages.id').where('languages.ownerId', '=', userId)).as('language'),
          eb.exists(eb.selectFrom('locales').select('locales.id').where('locales.ownerId', '=', userId)).as('locale'),
          eb.exists(eb.selectFrom('surveys').select('surveys.id').where('surveys.ownerId', '=', userId)).as('survey'),
          eb.exists(eb.selectFrom('surveySchemes').select('surveySchemes.id').where('surveySchemes.ownerId', '=', userId)).as('surveyScheme'),
        ])
        .executeTakeFirstOrThrow(),
    ]);

    const ownedTypes: Record<SecurableType, boolean> = {
      FAQ: !!owned.faq,
      FeedbackScheme: !!owned.feedbackScheme,
      Language: !!owned.language,
      Locale: !!owned.locale,
      Survey: !!owned.survey,
      SurveyScheme: !!owned.surveyScheme,
    };
    const types = new Set([
      ...securables.map(({ securableType }) => securableType),
      ...securableTypes.filter(type => ownedTypes[type]),
    ]);

    return [...types].map(securableToResource);
  };

  /**
   * Fetch user's permission names, including implied resource permissions:
   * - `{resource}` for every held `{resource}:{action}` permission
   * - `{resource}` for securable access to, or ownership of, a record of the type
   *
   * Resource permissions are not stored in DB, they only exist as implied names.
   *
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  const fetchPermissions = async (userId: string): Promise<string[]> => {
    const [user, securableResources] = await Promise.all([
      User.findByPk(userId, {
        include: [
          {
            association: 'permissions',
            through: { attributes: [] },
          },
          {
            association: 'roles',
            through: { attributes: [] },
            include: [
              {
                association: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      }),
      fetchSecurableResources(userId),
    ]);
    if (!user)
      return [];

    const names = user.allPermissions().map(({ name }) => name);
    // Derived from any prefix, so non-resource permissions like `metrics:app` also imply an unused `metrics`
    const prefixes = names.filter(name => name.includes(':')).map(name => name.split(':')[0]);

    return [
      ...new Set([
        ...names,
        ...prefixes,
        ...securableResources,
      ]),
    ];
  };

  /**
   * Fetch user's roles from database
   *
   * @param {string} userId
   * @returns {Promise<Role[]>}
   */
  const fetchRoles = async (userId: string): Promise<Role[]> => {
    const user = await User.findByPk(userId, {
      include: [
        {
          association: 'roles',
          through: { attributes: [] },
        },
      ],
    });
    if (!user)
      return [];

    return user.allRoles();
  };

  /**
   * Get user's permissions
   * - tries to fetch cached data if available and enabled
   * - then fetches data from database
   *
   * @param {string} userId
   * @returns {Promise<string[]>}
   */
  const getPermissions = async (userId: string): Promise<string[]> => {
    if (!enabled)
      return fetchPermissions(userId);

    return cache.remember<string[]>(`${ACL_PERMISSIONS_KEY}:${userId}`, ttl, () => fetchPermissions(userId));
  };

  /**
   * Get user's roles
   * - tries to fetch cached data if available and enabled
   * - then fetches data from database
   *
   * @returns {Promise<string[]>}
   */
  const getRoles = async (userId: string): Promise<string[]> => {
    if (!enabled)
      return (await fetchRoles(userId)).map(({ name }) => name);

    const roles = await cache.remember<Role[]>(`${ACL_ROLES_KEY}:${userId}`, ttl, () =>
      fetchRoles(userId));

    return roles.map(({ name }) => name);
  };

  /**
   * Get personal access token by token id for authentication
   *
   * @param {string} userId
   * @param {string} token
   * @returns {(Promise<PersonalAccessToken | null>)}
   */
  const getPersonalAccessToken = async (userId: string, token: string): Promise<PersonalAccessToken | null> => {
    return await cache.remember<PersonalAccessToken | null>(`${ACL_PAT_KEY}:${token}`, ttl, async () =>
      PersonalAccessToken.findOne({
        attributes: ['id', 'token', 'userId', 'createdAt'],
        where: {
          userId,
          token,
          revoked: false,
          expiresAt: {
            [Op.gt]: new Date(),
          },
        },
        include: [
          {
            association: 'user',
            attributes: [],
            required: true,
            where: {
              disabledAt: null,
              verifiedAt: { [Op.ne]: null },
            },
          },
        ],
      }));
  };

  return {
    getPermissions,
    getPersonalAccessToken,
    getRoles,
  };
}

export default aclCache;

export type ACLCache = ReturnType<typeof aclCache>;
