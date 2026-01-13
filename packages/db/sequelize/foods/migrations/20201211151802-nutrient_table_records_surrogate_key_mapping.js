export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('food_nutrient_mapping', 'v3_food_nutrient_mapping_1', {
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
          nutrient_table_record_id: {
            type: Sequelize.DataTypes.BIGINT,
            references: {
              model: 'nutrient_table_records',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          food_local_id: {
            type: Sequelize.DataTypes.BIGINT,
            allowNull: false,
            references: {
              model: 'food_locals',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          nutrient_table_id: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
          v3_nutrient_table_record_id: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO food_nutrient_mapping (food_local_id, nutrient_table_id, v3_nutrient_table_record_id) SELECT food_local_id, nutrient_table_id, nutrient_table_record_id FROM v3_food_nutrient_mapping_1',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_nutrient_mapping SET nutrient_table_record_id = nutrient_table_records.id from nutrient_table_records
                WHERE food_nutrient_mapping.nutrient_table_id = nutrient_table_records.nutrient_table_id
                  AND food_nutrient_mapping.v3_nutrient_table_record_id = nutrient_table_records.nutrient_table_record_id`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'food_nutrient_mapping',
        'nutrient_table_record_id',
        {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('food_nutrient_mapping', 'nutrient_table_id', {
        transaction,
      });

      await queryInterface.removeColumn('food_nutrient_mapping', 'v3_nutrient_table_record_id', {
        transaction,
      });
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
