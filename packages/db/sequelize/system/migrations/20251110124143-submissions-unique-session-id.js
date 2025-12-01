/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('survey_submissions', 'survey_submissions_session_id_idx', {
        transaction,
      });

      // De-duplicate existing data: keep most recent per session_id, null the rest
      await queryInterface.sequelize.query(
        `WITH RankedSubmissions AS (
          SELECT id, session_id, submission_time,
            ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY submission_time DESC) AS rn
          FROM survey_submissions
        )
        DELETE FROM survey_submissions
        WHERE id IN (
          SELECT id
          FROM RankedSubmissions
          WHERE rn > 1
        );`,
        { transaction },
      );

      await queryInterface.addConstraint('survey_submissions', {
        fields: ['session_id'],
        type: 'unique',
        name: 'survey_submissions_session_id_unique',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('survey_submissions', 'survey_submissions_session_id_unique', {
        transaction,
      });

      await queryInterface.addIndex('survey_submissions', ['session_id'], {
        name: 'survey_submissions_session_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),
};
