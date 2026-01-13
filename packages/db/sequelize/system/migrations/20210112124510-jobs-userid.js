export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'tools_tasks',
        'user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'tools_tasks',
        'user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );
    }),
};
