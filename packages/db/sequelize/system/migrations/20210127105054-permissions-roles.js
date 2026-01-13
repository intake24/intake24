export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'permissions',
        'display_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'roles',
        'display_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'permissions',
        'display_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'roles',
        'display_name',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    }),
};
