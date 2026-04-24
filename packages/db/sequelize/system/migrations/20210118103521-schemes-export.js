export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'schemes',
        'export',
        {
          allowNull: true,
          type: Sequelize.TEXT,
        },
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('schemes', 'export', { transaction });
    }),
};
