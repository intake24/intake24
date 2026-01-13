import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [{ name: 'surveys-overrides', display_name: 'Survey scheme overrides' }];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name IN ('surveys-overrides');`,
        { transaction },
      );
    }),
};
