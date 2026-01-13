export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'name',
        {
          type: Sequelize.STRING(512),
          unique: true,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE surveys SET name = id;`, { transaction });

      await queryInterface.changeColumn(
        'surveys',
        'name',
        {
          type: Sequelize.STRING(512),
          unique: true,
          allowNull: false,
        },
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('surveys', 'name', { transaction });
    }),
};
