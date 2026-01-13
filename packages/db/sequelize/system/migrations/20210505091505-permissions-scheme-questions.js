import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'scheme-questions-browse', display_name: 'Browse scheme questions' },
        { name: 'scheme-questions-detail', display_name: 'Read scheme questions' },
        { name: 'scheme-questions-create', display_name: 'Create scheme questions' },
        { name: 'scheme-questions-edit', display_name: 'Edit scheme questions' },
        { name: 'scheme-questions-delete', display_name: 'Delete scheme questions' },
        { name: 'scheme-questions-sync', display_name: 'Scheme questions synchronization' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'scheme-questions-%';`,
        { transaction },
      );
    }),
};
