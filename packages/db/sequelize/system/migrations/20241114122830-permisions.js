/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`UPDATE permissions SET "name" = REPLACE("name", '|', ':');`, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`UPDATE permissions SET "name" = REPLACE("name", ':', '|');`, { transaction });
    });
  },
};
