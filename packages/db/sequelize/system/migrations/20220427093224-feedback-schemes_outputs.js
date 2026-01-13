export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'feedback_schemes',
        'outputs',
        { allowNull: true, type: Sequelize.TEXT() },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE feedback_schemes SET outputs = :outputs;`, {
        type: queryInterface.sequelize.QueryTypes.UPDATE,
        replacements: { outputs: JSON.stringify(['print', 'email', 'download']) },
        transaction,
      });

      await queryInterface.changeColumn(
        'feedback_schemes',
        'outputs',
        { allowNull: false, type: Sequelize.TEXT() },
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('feedback_schemes', 'outputs', { transaction });
    }),
};
