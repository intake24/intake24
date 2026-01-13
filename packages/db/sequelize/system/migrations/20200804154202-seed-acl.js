export default {
  up: async (queryInterface) => {
    const created_at = new Date();
    const updated_at = created_at;

    const defaultRoles = [
      {
        name: 'superuser',
        display_name: 'Superuser',
        description: 'Role gets assigned with all permissions created in system.',
        created_at,
        updated_at,
      },
    ];

    await queryInterface.bulkInsert('roles', defaultRoles);

    const surveyIds = await queryInterface.sequelize.query(`SELECT id
                                                            FROM surveys;`);

    const surveyPerms = surveyIds[0].reduce((acc, survey) => {
      ['respondent', 'staff', 'support'].forEach((item) => {
        acc.push({
          name: `${survey.id}/${item}`,
          display_name: `${survey.id}/${item}`,
          created_at,
          updated_at,
        });
      });
      return acc;
    }, []);

    const fdbIds = await queryInterface.sequelize.query(`SELECT id
                                                         FROM locales;`);

    const fdbPerms = fdbIds[0].reduce((acc, fdb) => {
      acc.push({ name: `fdbm/${fdb.id}`, display_name: `fdbm/${fdb.id}`, created_at, updated_at });
      return acc;
    }, []);

    const resourcePerms = [
      { name: 'acl', display_name: 'Access Control List' },
      { name: 'globalsupport', display_name: 'Global Support' },
      { name: 'surveyadmin', display_name: 'Survey Admin' },
      { name: 'foodsadmin', display_name: 'Food DB Admin' },
      { name: 'users-browse', display_name: 'Browse users' },
      { name: 'users-detail', display_name: 'Read users' },
      { name: 'users-create', display_name: 'Create users' },
      { name: 'users-edit', display_name: 'Edit users' },
      { name: 'users-delete', display_name: 'Delete users' },
      { name: 'roles-browse', display_name: 'Browse roles' },
      { name: 'roles-detail', display_name: 'Read roles' },
      { name: 'roles-create', display_name: 'Create roles' },
      { name: 'roles-edit', display_name: 'Edit roles' },
      { name: 'roles-delete', display_name: 'Delete roles' },
      { name: 'permissions-browse', display_name: 'Browse permissions' },
      { name: 'permissions-detail', display_name: 'Read permissions' },
      { name: 'permissions-create', display_name: 'Create permissions' },
      { name: 'permissions-edit', display_name: 'Edit permissions' },
      { name: 'permissions-delete', display_name: 'Delete permissions' },
      { name: 'languages-browse', display_name: 'Browse languages' },
      { name: 'languages-detail', display_name: 'Read languages' },
      { name: 'languages-create', display_name: 'Create languages' },
      { name: 'languages-edit', display_name: 'Edit languages' },
      { name: 'languages-delete', display_name: 'Delete languages' },
      { name: 'locales-browse', display_name: 'Browse locales' },
      { name: 'locales-detail', display_name: 'Read locales' },
      { name: 'locales-create', display_name: 'Create locales' },
      { name: 'locales-edit', display_name: 'Edit locales' },
      { name: 'locales-delete', display_name: 'Delete locales' },
      { name: 'schemes-browse', display_name: 'Browse survey schemes' },
      { name: 'schemes-detail', display_name: 'Read survey schemes' },
      { name: 'schemes-create', display_name: 'Create survey schemes' },
      { name: 'schemes-edit', display_name: 'Edit survey schemes' },
      { name: 'schemes-delete', display_name: 'Delete survey schemes' },
      { name: 'schemes-questions', display_name: 'Survey scheme questions' },
      { name: 'surveys-browse', display_name: 'Browse surveys' },
      { name: 'surveys-detail', display_name: 'Read surveys' },
      { name: 'surveys-create', display_name: 'Create surveys' },
      { name: 'surveys-edit', display_name: 'Edit surveys' },
      { name: 'surveys-delete', display_name: 'Delete surveys' },
      { name: 'surveys-mgmt', display_name: 'Survey management' },
      { name: 'surveys-respondents', display_name: 'Survey respondents' },
      { name: 'surveys-submissions', display_name: 'Survey submissions' },
      { name: 'tasks-browse', display_name: 'Browse tasks' },
      { name: 'tasks-detail', display_name: 'Read tasks' },
      { name: 'tasks-create', display_name: 'Create tasks' },
      { name: 'tasks-edit', display_name: 'Edit tasks' },
      { name: 'tasks-delete', display_name: 'Delete tasks' },
    ].map(permission => ({ ...permission, created_at, updated_at }));

    await queryInterface.bulkInsert('permissions', resourcePerms.concat(surveyPerms, fdbPerms));

    const roles = await queryInterface.sequelize.query(`SELECT id, name
                                                        FROM roles;`);
    const permissions = await queryInterface.sequelize.query(`SELECT id, name
                                                              FROM permissions;`);

    const records = [];
    roles[0].forEach((role) => {
      permissions[0].reduce((acc, perm) => {
        acc.push({ permission_id: perm.id, role_id: role.id, created_at, updated_at });
        return acc;
      }, records);
    });

    // Length check is a workaround for https://github.com/sequelize/sequelize/issues/11071
    if (records.length > 0)
      await queryInterface.bulkInsert('permission_role', records);

    // Assign permissions based on legacy ACL system
    const roleMap = roles[0].reduce((acc, role) => {
      acc[role.name] = role.id;
      return acc;
    }, {});

    const permissionMap = permissions[0].reduce((acc, permission) => {
      acc[permission.name] = permission.id;
      return acc;
    }, {});

    const legacyRoles = await queryInterface.sequelize.query(
      `SELECT user_id, role
         FROM user_roles;`,
    );

    const newPermissions = [];
    const newRoles = [];

    if (legacyRoles[0].length) {
      legacyRoles[0].forEach((legacyRole) => {
        if (legacyRole.role in permissionMap) {
          newPermissions.push({
            permission_id: permissionMap[legacyRole.role],
            user_id: legacyRole.user_id,
            created_at,
            updated_at,
          });
        }

        // This should really be just a superuser role
        if (legacyRole.role in roleMap) {
          newRoles.push({
            role_id: roleMap[legacyRole.role],
            user_id: legacyRole.user_id,
            created_at,
            updated_at,
          });
        }
      });
    }

    // Length check is a workaround for https://github.com/sequelize/sequelize/issues/11071

    if (newPermissions.length > 0)
      await queryInterface.bulkInsert('permission_user', newPermissions);

    if (newRoles.length > 0)
      await queryInterface.bulkInsert('role_user', newRoles);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('permission_role', null, {});
    await queryInterface.bulkDelete('role_user', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
