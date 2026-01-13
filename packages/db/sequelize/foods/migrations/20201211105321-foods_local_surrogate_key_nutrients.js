export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('foods_nutrient_mapping', 'v3_foods_nutrient_mapping', {
        transaction,
      });

      await queryInterface.createTable(
        'food_nutrient_mapping',
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
          nutrient_table_id: {
            type: new Sequelize.DataTypes.STRING(64),
            allowNull: false,
          },
          nutrient_table_record_id: {
            type: new Sequelize.DataTypes.STRING(64),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO food_nutrient_mapping (food_code, locale_id, nutrient_table_id, nutrient_table_record_id) SELECT food_code, locale_id, nutrient_table_id, nutrient_table_record_id FROM v3_foods_nutrient_mapping',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'UPDATE food_nutrient_mapping SET food_local_id = food_locals.id from food_locals WHERE food_nutrient_mapping.food_code = food_locals.food_code AND food_nutrient_mapping.locale_id = food_locals.locale_id',
        { transaction },
      );

      await queryInterface.changeColumn(
        'food_nutrient_mapping',
        'food_local_id',
        {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.addConstraint('food_nutrient_mapping', {
        fields: ['food_local_id'],
        type: 'foreign key',
        references: {
          table: 'food_locals',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        name: 'food_nutrient_mapping_food_local_id_fk',
        transaction,
      });

      await queryInterface.removeColumn('food_nutrient_mapping', 'locale_id', { transaction });

      await queryInterface.removeColumn('food_nutrient_mapping', 'food_code', { transaction });
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
