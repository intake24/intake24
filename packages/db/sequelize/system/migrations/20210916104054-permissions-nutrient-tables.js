import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'nutrient-tables-browse', display_name: 'Browse nutrient tables' },
        { name: 'nutrient-tables-read', display_name: 'Read nutrient tables' },
        { name: 'nutrient-tables-create', display_name: 'Create nutrient tables' },
        { name: 'nutrient-tables-edit', display_name: 'Edit nutrient tables' },
        { name: 'nutrient-tables-delete', display_name: 'Delete nutrient tables' },
        { name: 'nutrient-tables-upload', display_name: 'Nutrient tables upload' },
      ];

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'nutrient-tables-%';`,
        { transaction },
      );
    }),
};
