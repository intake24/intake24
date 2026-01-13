export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['name', 'brand', 'description', 'portion_size', 'leftovers'].map(field => queryInterface.changeColumn(
          'survey_submission_missing_foods',
          field,
          { allowNull: true, type: Sequelize.STRING(512) },
          { transaction },
        )),
      );
    }),

  down: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['name', 'brand', 'description', 'portion_size', 'leftovers'].map(field => queryInterface.changeColumn(
          'survey_submission_missing_foods',
          field,
          { allowNull: false, type: Sequelize.STRING(512) },
          { transaction },
        )),
      );
    }),
};
