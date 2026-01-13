/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'drinkware_scales_v2',
        'drinkware_scales_v2_drinkware_set_id_fkey',
        { transaction },
      );

      await queryInterface.addConstraint('drinkware_scales_v2', {
        fields: ['drinkware_set_id'],
        type: 'foreign key',
        references: {
          table: 'drinkware_sets',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'drinkware_scales_v2_drinkware_set_id_fk',
        transaction,
      });

      await queryInterface.addIndex('drinkware_scales_v2', ['drinkware_set_id'], {
        name: 'drinkware_scales_v2_drinkware_set_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'drinkware_scales_v2',
        'drinkware_scales_v2_drinkware_set_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'drinkware_scales_v2',
        'drinkware_scales_v2_drinkware_set_id_idx',
        { transaction },
      );

      await queryInterface.addConstraint('drinkware_scales_v2', {
        fields: ['drinkware_set_id'],
        type: 'foreign key',
        references: {
          table: 'drinkware_sets',
          field: 'id',
        },
        onUpdate: 'no action',
        onDelete: 'no action',
        name: 'drinkware_scales_v2_drinkware_set_id_fkey',
        transaction,
      });
    }),
};
