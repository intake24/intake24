export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'tasks',
        'params',
        {
          allowNull: true,
          type: Sequelize.TEXT,
          after: 'description',
        },
        { transaction },
      );
    });
  },
  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('tasks', 'params', { transaction });
    });
  },
};
