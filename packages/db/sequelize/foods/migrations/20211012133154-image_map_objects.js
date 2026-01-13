export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'image_map_objects',
        'outline_coordinates_json',
        {
          allowNull: true,
          type: Sequelize.TEXT({ length: 'long' }),
          after: 'outline_coordinates',
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE image_map_objects SET outline_coordinates_json = array_to_json(outline_coordinates);`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'image_map_objects',
        'outline_coordinates_json',
        { allowNull: false, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      await queryInterface.removeColumn('image_map_objects', 'outline_coordinates', {
        transaction,
      });

      await queryInterface.renameColumn(
        'image_map_objects',
        'outline_coordinates_json',
        'outline_coordinates',
        { transaction },
      );
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
