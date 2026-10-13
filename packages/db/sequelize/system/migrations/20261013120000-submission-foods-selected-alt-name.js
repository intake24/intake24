/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.addColumn('survey_submission_foods', 'selected_alt_name', {
      allowNull: true,
      type: Sequelize.TEXT,
    }),

  down: queryInterface =>
    queryInterface.removeColumn('survey_submission_foods', 'selected_alt_name'),
};
