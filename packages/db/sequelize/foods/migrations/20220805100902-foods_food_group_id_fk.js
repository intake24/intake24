export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('foods', 'food_group_id_fk', { transaction });

      await queryInterface.addConstraint('foods', {
        fields: ['food_group_id'],
        type: 'foreign key',
        references: {
          table: 'food_groups',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
