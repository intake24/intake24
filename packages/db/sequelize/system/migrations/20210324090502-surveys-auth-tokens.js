export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'auth_url_token_charset',
        {
          allowNull: true,
          type: Sequelize.STRING(128),
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'surveys',
        'auth_url_token_length',
        {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        { transaction },
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('surveys', 'auth_url_token_charset', { transaction });
      await queryInterface.removeColumn('surveys', 'auth_url_token_length', { transaction });
    }),
};
