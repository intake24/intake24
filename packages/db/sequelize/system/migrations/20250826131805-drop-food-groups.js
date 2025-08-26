/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const names = [
        'food-groups',
        'food-groups:browse',
        'food-groups:read',
        'food-groups:create',
        'food-groups:edit',
        'food-groups:delete',
      ].map(({ name }) => `'${name}'`).join(`,`);

      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, { transaction });

      await queryInterface.removeColumn('survey_submission_foods', 'food_group_id', { transaction });
      await queryInterface.removeColumn('survey_submission_foods', 'food_group_english_name', { transaction });
      await queryInterface.removeColumn('survey_submission_foods', 'food_group_local_name', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
