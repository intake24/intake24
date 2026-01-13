import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'fdbs-browse', display_name: 'Browse food databases' },
        { name: 'fdbs-read', display_name: 'Read food databases' },
        { name: 'fdbs-create', display_name: 'Create food databases' },
        { name: 'fdbs-edit', display_name: 'Edit food databases' },
        { name: 'fdbs-delete', display_name: 'Delete food databases' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name LIKE 'fdbs-%';`, {
        transaction,
      });
    }),
};
