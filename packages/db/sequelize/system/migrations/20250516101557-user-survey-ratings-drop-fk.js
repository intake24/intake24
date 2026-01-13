/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('user_survey_ratings', 'user_survey_ratings_submission_id_fk', { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint('user_survey_ratings', {
        fields: ['submission_id'],
        name: 'user_survey_ratings_submission_id_fk',
        type: 'foreign key',
        references: {
          table: 'survey_submissions',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        transaction,
      });
    });
  },
};
