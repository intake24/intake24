import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'as-served-browse', display_name: 'Browse as server sets' },
        { name: 'as-served-detail', display_name: 'Read as server sets' },
        { name: 'as-served-create', display_name: 'Create as server sets' },
        { name: 'as-served-edit', display_name: 'Edit as server sets' },
        { name: 'as-served-delete', display_name: 'Delete as server sets' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'as-served-%';`,
        { transaction },
      );
    }),
};
