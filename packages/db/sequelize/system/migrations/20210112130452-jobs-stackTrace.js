export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'tools_tasks',
        'stack_trace',
        {
          type: Sequelize.TEXT({ length: 'long' }),
          allowNull: true,
        },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'tools_tasks',
        'stack_trace',
        {
          type: Sequelize.STRING(2048),
          allowNull: true,
        },
        { transaction },
      );
    }),
};
