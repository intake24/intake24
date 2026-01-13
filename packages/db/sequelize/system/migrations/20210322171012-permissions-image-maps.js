import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'image-maps-browse', display_name: 'Browse guide images' },
        { name: 'image-maps-detail', display_name: 'Read guide images' },
        { name: 'image-maps-create', display_name: 'Create guide images' },
        { name: 'image-maps-edit', display_name: 'Edit guide images' },
        { name: 'image-maps-delete', display_name: 'Delete guide images' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name LIKE 'image-maps-%';`,
        { transaction },
      );
    }),
};
