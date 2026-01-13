export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable(
        'foods_portion_size_methods',
        'v3_foods_portion_size_methods',
        { transaction },
      );

      await queryInterface.createTable(
        'food_portion_size_methods',
        {
          id: {
            type: Sequelize.DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_local_id: {
            type: Sequelize.DataTypes.BIGINT,
          },
          food_code: {
            type: new Sequelize.DataTypes.STRING(8),
            allowNull: false,
          },
          locale_id: {
            type: new Sequelize.DataTypes.STRING(16),
            allowNull: false,
          },
          method: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
          description: {
            type: new Sequelize.DataTypes.STRING(256),
            allowNull: false,
          },
          image_url: {
            type: new Sequelize.DataTypes.STRING(512),
            allowNull: false,
          },
          use_for_recipes: {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
          },
          conversion_factor: {
            type: Sequelize.DataTypes.FLOAT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('food_portion_size_methods', ['food_local_id'], {
        name: 'food_portion_size_methods_food_local_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('food_portion_size_methods', {
        fields: ['food_local_id'],
        type: 'foreign key',
        references: {
          table: 'food_locals',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        name: 'food_portion_size_methods_food_local_id_fk',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO food_portion_size_methods (id, food_code, locale_id, "method", description, image_url, use_for_recipes, conversion_factor) SELECT id, food_code, locale_id, "method", description, image_url, use_for_recipes, conversion_factor FROM v3_foods_portion_size_methods',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'UPDATE food_portion_size_methods SET food_local_id = food_locals.id from food_locals WHERE food_portion_size_methods.food_code = food_locals.food_code AND food_portion_size_methods.locale_id = food_locals.locale_id',
        { transaction },
      );

      await queryInterface.changeColumn(
        'food_portion_size_methods',
        'food_local_id',
        {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('food_portion_size_methods', 'food_code', { transaction });

      await queryInterface.removeColumn('food_portion_size_methods', 'locale_id', { transaction });

      await queryInterface.removeConstraint(
        'foods_portion_size_method_params',
        'foods_portion_size_method_params_portion_size_method_id_fk',
        { transaction },
      );

      await queryInterface.addConstraint('foods_portion_size_method_params', {
        fields: ['portion_size_method_id'],
        type: 'foreign key',
        references: {
          table: 'food_portion_size_methods',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        name: 'foods_portion_size_method_params_portion_size_method_id_fk',
        transaction,
      });
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
