export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['drinkware_scales', 'guide_image_objects', 'image_map_objects'].map(table =>
          queryInterface.addColumn(
            table,
            'label',
            { allowNull: true, type: Sequelize.TEXT({ length: 'long' }) },
            { transaction },
          ),
        ),
      );

      await queryInterface.changeColumn(
        'drinkware_scales',
        'choice_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeIndex('drinkware_sets', 'drinkware_sets_guide_image_id_index', {
        transaction,
      });

      await queryInterface.renameColumn('drinkware_sets', 'guide_image_id', 'image_map_id', {
        transaction,
      });

      await queryInterface.addConstraint('drinkware_sets', {
        fields: ['image_map_id'],
        type: 'foreign key',
        references: {
          table: 'image_maps',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'drinkware_sets_image_map_id_fk',
        transaction,
      });

      await queryInterface.addIndex('drinkware_sets', ['image_map_id'], {
        name: 'drinkware_sets_image_map_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['drinkware_scales', 'guide_image_objects', 'image_map_objects'].map(table =>
          queryInterface.removeColumn(table, 'label', { transaction }),
        ),
      );

      await queryInterface.changeColumn(
        'drinkware_scales',
        'choice_id',
        { type: Sequelize.INTEGER, allowNull: false },
        { transaction },
      );

      await queryInterface.removeIndex('drinkware_sets', 'drinkware_sets_image_map_id_idx', {
        transaction,
      });

      await queryInterface.removeConstraint('drinkware_sets', 'drinkware_sets_image_map_id_fk', {
        transaction,
      });

      await queryInterface.renameColumn('drinkware_sets', 'image_map_id', 'guide_image_id', {
        transaction,
      });

      await queryInterface.addIndex('drinkware_sets', ['guide_image_id'], {
        name: 'drinkware_sets_guide_image_id_index',
        indexType: 'btree',
        transaction,
      });
    }),
};
