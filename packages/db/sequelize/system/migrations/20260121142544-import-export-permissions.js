import { createPermissions } from '../../utils.js';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'packages:export', display_name: 'Export food database packages' },
        { name: 'packages:import', display_name: 'Import food database packages' },
        { name: 'upload-large-files', display_name: 'Upload large files' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name IN ('packages:export', 'packages:import', 'upload-large-files');`,
        { transaction },
      );
    });
  },
};
