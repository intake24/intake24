/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('foods', 'food_group_id', { transaction });
      await queryInterface.dropTable('food_group_locals', { transaction });
      await queryInterface.dropTable('food_groups', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
