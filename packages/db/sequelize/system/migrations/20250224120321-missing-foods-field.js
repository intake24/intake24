/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(['description', 'portion_size', 'leftovers'].map(async column =>
        queryInterface.changeColumn(
          'survey_submission_missing_foods',
          column,
          {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          { transaction },
        )),
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(['description', 'portion_size', 'leftovers'].map(async column =>
        queryInterface.changeColumn(
          'survey_submission_missing_foods',
          column,
          {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
          { transaction },
        )),
      );
    });
  },
};
