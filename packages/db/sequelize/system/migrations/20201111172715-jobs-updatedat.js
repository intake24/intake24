export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'tools_tasks',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE tools_tasks SET updated_at = completed_at`, {
        transaction,
      });

      await queryInterface.sequelize.query(
        `UPDATE tools_tasks SET updated_at = created_at WHERE updated_at IS NULL`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'tools_tasks',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: false,
        },
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('tools_tasks', 'updated_at', { transaction });
    }),
};
