/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'UPDATE locales SET owner_id = NULL WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM users)',
        { transaction },
      );

      await queryInterface.addConstraint('locales', {
        fields: ['owner_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'locales_owner_id_fk',
        transaction,
      });

      await queryInterface.addIndex('locales', ['owner_id'], {
        name: 'locales_owner_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'locales',
        'locales_owner_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'locales',
        'locales_owner_id_idx',
        { transaction },
      );
    }),
};
