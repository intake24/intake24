export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'associated_foods',
        'order_by',
        { allowNull: true, type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE associated_foods SET order_by = id;`, {
        transaction,
      });

      await queryInterface.changeColumn(
        'associated_foods',
        'order_by',
        { allowNull: false, type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.addColumn(
        'category_portion_size_methods',
        'order_by',
        { allowNull: true, type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_portion_size_methods SET order_by = id;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'category_portion_size_methods',
        'order_by',
        { allowNull: false, type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.addColumn(
        'food_portion_size_methods',
        'order_by',
        { allowNull: true, type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE food_portion_size_methods SET order_by = id;`, {
        transaction,
      });

      await queryInterface.changeColumn(
        'food_portion_size_methods',
        'order_by',
        { allowNull: false, type: Sequelize.BIGINT },
        { transaction },
      );
    }),

  async down(queryInterface) {
    await queryInterface.removeColumn('associated_foods', 'order_by');
    await queryInterface.removeColumn('category_portion_size_methods', 'order_by');
    await queryInterface.removeColumn('food_portion_size_methods', 'order_by');
  },
};
