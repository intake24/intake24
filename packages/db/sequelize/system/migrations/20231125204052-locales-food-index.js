export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'locales',
        'food_index_enabled',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE locales SET food_index_enabled = true WHERE id IN (SELECT locale_id FROM surveys WHERE state = 'active')`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'locales',
        'locales_food_index_language_backend_id_fk',
        { transaction },
      );
      await queryInterface.dropTable('food_index_language_backends', { transaction });
    }),

  down: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('locales', 'food_index_enabled', { transaction });

      await queryInterface.createTable(
        'food_index_language_backends',
        {
          id: {
            type: Sequelize.STRING(16),
            primaryKey: true,
          },
          flag: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'insert into food_index_language_backends(id, flag, description) values (\'en\', \'gb\', \'English\')',
        { transaction },
      );

      await queryInterface.addConstraint('locales', {
        fields: ['food_index_language_backend_id'],
        name: 'locales_food_index_language_backend_id_fk',
        type: 'foreign key',
        references: {
          table: 'food_index_language_backends',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });
    }),
};
