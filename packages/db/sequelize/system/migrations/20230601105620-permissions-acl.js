import { createPermissions } from '../../utils.js';

const permissions = [
  { name: 'permissions|roles', display_name: 'Permission roles' },
  { name: 'permissions|users', display_name: 'Permission users' },
  { name: 'roles|permissions', display_name: 'Role permissions' },
  { name: 'roles|users', display_name: 'Role users' },
  { name: 'users|permissions', display_name: 'User permissions' },
  { name: 'users|roles', display_name: 'User roles' },
];

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });
    }),
};
