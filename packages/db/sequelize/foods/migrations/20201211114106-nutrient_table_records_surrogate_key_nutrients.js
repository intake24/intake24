export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable(
        'nutrient_table_records_nutrients',
        'v3_nutrient_table_records_nutrients',
        {
          transaction,
        },
      );

      await queryInterface.createTable(
        'nutrient_table_record_nutrients',

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
          nutrient_type_id: {
            type: Sequelize.DataTypes.BIGINT,
            references: {
              model: 'nutrient_types',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          units_per_100g: {
            type: Sequelize.DataTypes.DOUBLE,
            allowNull: false,
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
        'INSERT INTO nutrient_table_record_nutrients (nutrient_table_id, v3_nutrient_table_record_id, nutrient_type_id, units_per_100g) SELECT nutrient_table_id, nutrient_table_record_id, nutrient_type_id, units_per_100g FROM v3_nutrient_table_records_nutrients',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE nutrient_table_record_nutrients SET nutrient_table_record_id = nutrient_table_records.id from nutrient_table_records
                WHERE nutrient_table_record_nutrients.nutrient_table_id = nutrient_table_records.nutrient_table_id
                  AND nutrient_table_record_nutrients.v3_nutrient_table_record_id = nutrient_table_records.nutrient_table_record_id`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'nutrient_table_record_nutrients',
        'nutrient_table_record_id',
        {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('nutrient_table_record_nutrients', 'nutrient_table_id', {
        transaction,
      });

      await queryInterface.removeColumn(
        'nutrient_table_record_nutrients',
        'v3_nutrient_table_record_id',
        { transaction },
      );
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
