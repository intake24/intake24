export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'image_map_objects',
        'overlay_image_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'image_map_objects',
        'overlay_image_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );
    }),
};
