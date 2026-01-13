export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE surveys SET store_user_session_on_server = false WHERE store_user_session_on_server IS NULL`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'surveys',
        'store_user_session_on_server',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'surveys',
        'store_user_session_on_server',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );
    }),
};
