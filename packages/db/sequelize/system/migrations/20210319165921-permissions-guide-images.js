import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'guide-images-browse', display_name: 'Browse guide images' },
        { name: 'guide-images-detail', display_name: 'Read guide images' },
        { name: 'guide-images-create', display_name: 'Create guide images' },
        { name: 'guide-images-edit', display_name: 'Edit guide images' },
        { name: 'guide-images-delete', display_name: 'Delete guide images' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'guide-images-%';`,
        { transaction },
      );
    }),
};
