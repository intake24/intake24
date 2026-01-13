import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'food-groups-browse', display_name: 'Browse food groups' },
        { name: 'food-groups-read', display_name: 'Read food groups' },
        { name: 'food-groups-create', display_name: 'Create food groups' },
        { name: 'food-groups-edit', display_name: 'Edit food groups' },
        { name: 'food-groups-delete', display_name: 'Delete food groups' },
      ];

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'food-groups-%';`,
        { transaction },
      );
    }),
};
