/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `update permissions set name='packages:export' where name ='export-package';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `update permissions set name='packages:import' where name ='import-package';`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `update permissions set name='export-package' where name ='packages:export';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `update permissions set name='import-package' where name='packages:import';`,
        { transaction },
      );
    });
  },
};
