module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Update fixed_food_ranking table
      await queryInterface.changeColumn(
        'fixed_food_ranking',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update popularity_counters table
      await queryInterface.changeColumn(
        'popularity_counters',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );
    }),

  down: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Revert fixed_food_ranking table
      await queryInterface.changeColumn(
        'fixed_food_ranking',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert popularity_counters table
      await queryInterface.changeColumn(
        'popularity_counters',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );
    }),
};
