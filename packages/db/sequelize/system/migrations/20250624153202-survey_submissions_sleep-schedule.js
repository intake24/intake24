/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('survey_submissions', 'wake_up_time', {
        type: Sequelize.TIME,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('survey_submissions', 'sleep_time', {
        type: Sequelize.TIME,
        allowNull: true,
      }, { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('survey_submissions', 'wake_up_time', { transaction });
      await queryInterface.removeColumn('survey_submissions', 'sleep_time', { transaction });
    }),
};
