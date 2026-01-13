export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'jobs',
        'params',
        { allowNull: true, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('jobs', 'params', { transaction });
    }),
};
