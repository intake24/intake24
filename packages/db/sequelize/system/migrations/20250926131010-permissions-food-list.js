import { createPermissions } from '../../utils.js';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [{ name: 'locales:food-list:edit', display_name: 'Locale - edit food list' }];
      await createPermissions(permissions, { queryInterface, transaction });

      await queryInterface.sequelize.query(`update permissions set display_name = 'Locale - view food list' where name = 'locales:food-list';`, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name IN ('locales:food-list:edit');`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `update permissions set display_name = 'Locale food list' where name = 'locales:food-list';`,
        { transaction },
      );
    });
  },
};
