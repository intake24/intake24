export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('v3_client_error_reports', { transaction });
      await queryInterface.dropTable('v3_flyway_migrations', { transaction });
      await queryInterface.dropTable('v3_jobs', { transaction });
      await queryInterface.dropTable('v3_local_fields', { transaction });
      await queryInterface.dropTable('v3_local_nutrient_types', { transaction });
      await queryInterface.dropTable('v3_missing_foods', { transaction });
      await queryInterface.dropTable('v3_schema_version', { transaction });
      await queryInterface.dropTable('v3_signin_log', { transaction });
      await queryInterface.dropTable('v3_survey_submission_fields', { transaction });
      await queryInterface.dropTable('v3_survey_submission_nutrients', { transaction });
      await queryInterface.dropTable('v3_survey_submission_portion_size_fields', { transaction });
      await queryInterface.dropTable('v3_survey_submission_food_custom_fields', { transaction });
      await queryInterface.dropTable('v3_survey_submission_foods', { transaction });
      await queryInterface.dropTable('v3_survey_submission_missing_foods', { transaction });
      await queryInterface.dropTable('v3_survey_submission_meal_custom_fields', { transaction });
      await queryInterface.dropTable('v3_survey_submission_meals', { transaction });
      await queryInterface.dropTable('v3_survey_submission_custom_fields', { transaction });
      await queryInterface.dropTable('v3_survey_submissions', { transaction });
      await queryInterface.dropTable('v3_nutrient_types', { transaction });
      await queryInterface.dropTable('v3_nutrient_units', { transaction });
      await queryInterface.dropTable('v3_user_custom_fields', { transaction });
      await queryInterface.dropTable('v3_user_notification_schedule', { transaction });
      await queryInterface.dropTable('v3_user_permissions', { transaction });
      await queryInterface.dropTable('v3_user_roles', { transaction });
      await queryInterface.dropTable('v3_user_sessions', { transaction });
      await queryInterface.dropTable('v3_users', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
