export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('food_index_language_backends', {
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
    });

    await queryInterface.sequelize.query(
      'insert into food_index_language_backends(id, flag, description) values (\'en\', \'gb\', \'English\')',
    );

    await queryInterface.addColumn('locales', 'food_index_language_backend_id', {
      type: Sequelize.STRING(16),
      defaultValue: 'en',
      allowNull: false,
    });

    await queryInterface.addConstraint('locales', {
      fields: ['food_index_language_backend_id'],
      type: 'foreign key',
      name: 'language_backend_fk',
      references: {
        table: 'food_index_language_backends',
        field: 'id',
      },
      onDelete: 'restrict',
      onUpdate: 'cascade',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('locales', 'food_index_language_backend_id');
    await queryInterface.dropTable('food_index_language_backends');
  },
};
