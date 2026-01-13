export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'survey_submission_foods',
        'english_description',
        'english_name',
        { transaction },
      );
      await queryInterface.renameColumn(
        'survey_submission_foods',
        'local_description',
        'local_name',
        { transaction },
      );
      await queryInterface.renameColumn(
        'survey_submission_foods',
        'food_group_english_description',
        'food_group_english_name',
        { transaction },
      );
      await queryInterface.renameColumn(
        'survey_submission_foods',
        'food_group_local_description',
        'food_group_local_name',
        { transaction },
      );
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
