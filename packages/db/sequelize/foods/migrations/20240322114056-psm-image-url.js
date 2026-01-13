/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('category_portion_size_methods', 'image_url', {
        transaction,
      });
      await queryInterface.removeColumn('food_portion_size_methods', 'image_url', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
