import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'schemes-data-export', display_name: 'Survey scheme data export' },
        { name: 'surveys-data-export', display_name: 'Survey data export' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name IN ('schemes-data-export', 'surveys-data-export');`,
        { transaction },
      );
    }),
};
