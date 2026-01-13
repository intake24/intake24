import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'sign-in-logs-browse', display_name: 'Browse sign-in logs' },
        { name: 'sign-in-logs-detail', display_name: 'Read sign-in logs' },
        { name: 'sign-in-logs-delete', display_name: 'Delete sign-in logs' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'sign-in-logs-%';`,
        { transaction },
      );
    }),
};
