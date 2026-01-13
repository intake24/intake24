import { createPermissions } from '../../utils.js';

const permissions = [{ name: 'locales|recipe-foods', display_name: 'Locale recipe foods' }];

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
