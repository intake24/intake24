export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'surveys',
        'start_date',
        {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'surveys',
        'end_date',
        {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        { transaction },
      );
    }),

  down: () => Promise.resolve(),
};
