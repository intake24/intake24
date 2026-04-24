/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'mfa_devices',
        'secret',
        {
          allowNull: false,
          type: Sequelize.TEXT,
        },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'mfa_devices',
        'secret',
        {
          allowNull: false,
          type: Sequelize.STRING(128),
        },
        { transaction },
      );
    }),
};
