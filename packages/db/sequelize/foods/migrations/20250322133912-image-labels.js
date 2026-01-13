/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all([
        ['as_served_sets', 'as_served_images', 'drinkware_sets', 'guide_images', 'image_maps'].map(table =>
          queryInterface.addColumn(
            table,
            'label',
            {
              type: Sequelize.TEXT({ length: 'long' }),
              allowNull: true,
            },
            { transaction },
          )),
      ]);

      await queryInterface.changeColumn(
        'drinkware_scales_v2',
        'label',
        {
          type: Sequelize.TEXT({ length: 'long' }),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(`
        UPDATE food_portion_size_methods
        SET parameters = parameters::jsonb - 'imageMapLabels' || jsonb_build_object('labels', parameters::jsonb->'imageMapLabels')
        WHERE parameters::jsonb ? 'imageMapLabels';
        `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE category_portion_size_methods
        SET parameters = parameters::jsonb - 'imageMapLabels' || jsonb_build_object('labels', parameters::jsonb->'imageMapLabels')
        WHERE parameters::jsonb ? 'imageMapLabels';
        `, { transaction });
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all([
        ['as_served_sets', 'as_served_images', 'drinkware_sets', 'guide_images', 'image_maps'].map(table =>
          queryInterface.removeColumn(table, 'label', { transaction })),
      ]);

      await queryInterface.changeColumn(
        'drinkware_scales_v2',
        'label',
        {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(`
        UPDATE food_portion_size_methods
        SET parameters = parameters::jsonb - 'labels' || jsonb_build_object('imageMapLabels', parameters::jsonb->'labels')
        WHERE parameters::jsonb ? 'labels';
        `, { transaction });
      await queryInterface.sequelize.query(`
        UPDATE category_portion_size_methods
        SET parameters = parameters::jsonb - 'labels' || jsonb_build_object('imageMapLabels', parameters::jsonb->'labels')
        WHERE parameters::jsonb ? 'labels';
        `, { transaction });
    }),
};
