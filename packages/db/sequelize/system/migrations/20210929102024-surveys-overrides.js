export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'overrides',
        {
          allowNull: true,
          type: Sequelize.TEXT({ length: 'long' }),
        },
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('surveys', 'overrides', { transaction });
    }),
};
