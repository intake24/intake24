export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('foods_local', 'v3_foods_local', { transaction });

      await queryInterface.createTable(
        'food_locals',
        {
          id: {
            type: Sequelize.DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_code: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
          locale_id: {
            type: new Sequelize.DataTypes.STRING(16),
            allowNull: false,
          },
          name: new Sequelize.DataTypes.STRING(256),
          simple_name: new Sequelize.DataTypes.STRING(256),
          version: {
            type: Sequelize.DataTypes.UUID,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('food_locals', ['food_code'], {
        name: 'food_locals_food_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('food_locals', ['locale_id'], {
        name: 'food_locals_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('food_locals', {
        fields: ['food_code'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'code',
        },
        name: 'food_locals_food_code_fk',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction,
      });

      await queryInterface.addConstraint('food_locals', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        name: 'food_locals_locale_id_fk',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction,
      });

      await queryInterface.addConstraint('food_locals', {
        fields: ['food_code', 'locale_id'],
        type: 'unique',
        name: 'food_locals_unique',
        transaction,
      });

      await queryInterface.addIndex('food_locals', ['name'], {
        name: 'food_locals_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('food_locals', ['simple_name'], {
        name: 'food_locals_simple_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO food_locals (food_code, locale_id, "name", simple_name, "version") SELECT food_code, locale_id, local_description, simple_local_description, "version" FROM v3_foods_local',
        { transaction },
      );

      await queryInterface.changeColumn(
        'food_locals',
        'food_code',
        {
          type: new Sequelize.DataTypes.STRING(32),
          allowNull: false,
        },
        {
          transaction,
        },
      );
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
