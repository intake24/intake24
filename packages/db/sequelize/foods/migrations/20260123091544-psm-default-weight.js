/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.addColumn(
            table,
            'default_weight',
            { type: Sequelize.FLOAT, allowNull: true },
            { transaction },
          )),
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods']
          .map(table =>
            queryInterface.removeColumn(table, 'default_weight', { transaction }),
          ),
      );
    }),
};
