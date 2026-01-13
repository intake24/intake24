export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'users',
        'verified_at',
        {
          allowNull: true,
          type: Sequelize.DATE,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users',
        'disabled_at',
        {
          allowNull: true,
          type: Sequelize.DATE,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE users SET verified_at = CURRENT_TIMESTAMP WHERE email IS NOT NULL;`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('users', 'verified_at', { transaction });
      await queryInterface.removeColumn('users', 'disabled_at', { transaction });
    }),
};
