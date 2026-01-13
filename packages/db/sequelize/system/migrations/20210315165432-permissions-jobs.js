import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'jobs-browse', display_name: 'Browse jobs' },
        { name: 'jobs-detail', display_name: 'Read jobs' },
        { name: 'jobs-create', display_name: 'Create jobs' },
        { name: 'jobs-edit', display_name: 'Edit jobs' },
        { name: 'jobs-delete', display_name: 'Delete jobs' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name LIKE 'jobs-%';`, {
        transaction,
      });
    }),
};
