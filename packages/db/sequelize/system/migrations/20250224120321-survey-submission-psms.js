/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        UPDATE survey_submission_portion_size_fields SET "name" = 'quantity' FROM survey_submission_foods
        WHERE
          survey_submission_foods.id = survey_submission_portion_size_fields.food_id
          AND survey_submission_foods.portion_size_method_id = 'drink-scale'
          AND "name" = 'count';`, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        UPDATE survey_submission_portion_size_fields SET "name" = 'count' FROM survey_submission_foods
        WHERE
          survey_submission_foods.id = survey_submission_portion_size_fields.food_id
          AND survey_submission_foods.portion_size_method_id = 'drink-scale'
          AND "name" = 'quantity';`, { transaction });
    });
  },
};
