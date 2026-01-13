export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'survey_submission_foods',
        'brand',
        { allowNull: true, type: Sequelize.STRING(128) },
        { transaction },
      );

      await queryInterface.addColumn(
        'survey_submission_foods',
        'barcode',
        { allowNull: true, type: Sequelize.STRING(128) },
        { transaction },
      );

      await queryInterface.addColumn(
        'survey_submission_missing_foods',
        'barcode',
        { allowNull: true, type: Sequelize.STRING(128) },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods SET brand = '' WHERE brand IS NULL;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_foods',
        'brand',
        { allowNull: false, type: Sequelize.STRING(128) },
        { transaction },
      );

      await queryInterface.removeColumn('survey_submission_foods', 'barcode', { transaction });
      await queryInterface.removeColumn('survey_submission_missing_foods', 'barcode', {
        transaction,
      });
    }),
};
