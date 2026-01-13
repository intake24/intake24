export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'auth_captcha',
        {
          allowNull: false,
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction },
      );
    }),
  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('surveys', 'auth_captcha', { transaction });
    }),
};
