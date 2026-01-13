export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'survey_submissions',
        'user_agent',
        { allowNull: true, type: Sequelize.STRING(512) },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submissions SET user_agent = survey_submission_custom_fields.value FROM survey_submission_custom_fields WHERE survey_submissions.id = survey_submission_custom_fields.survey_submission_id AND survey_submission_custom_fields."name" = '_userAgent'`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DELETE FROM survey_submission_custom_fields WHERE "name" = '_userAgent'`,
        { transaction },
      );
    }),

  down: async () => {
    throw new Error('This migration cannot be undone');
  },
};
