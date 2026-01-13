/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('survey_submissions', 'survey_submissions_session_id_idx', {
        transaction,
      });

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
