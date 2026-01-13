export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable(
        'nutrient_table_records_fields',
        'v3_nutrient_table_records_fields',
        {
          transaction,
        },
      );

      await queryInterface.createTable(
        'nutrient_table_record_fields',

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
          name: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
          value: {
            type: new Sequelize.DataTypes.STRING(512),
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
        'INSERT INTO nutrient_table_record_fields (nutrient_table_id, v3_nutrient_table_record_id, name, value) SELECT nutrient_table_id, nutrient_table_record_id, field_name, field_value FROM v3_nutrient_table_records_fields',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE nutrient_table_record_fields SET nutrient_table_record_id = nutrient_table_records.id from nutrient_table_records
                WHERE nutrient_table_record_fields.nutrient_table_id = nutrient_table_records.nutrient_table_id
                  AND nutrient_table_record_fields.v3_nutrient_table_record_id = nutrient_table_records.nutrient_table_record_id`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'nutrient_table_record_fields',
        'nutrient_table_record_id',
        {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('nutrient_table_record_fields', 'nutrient_table_id', {
        transaction,
      });

      await queryInterface.removeColumn(
        'nutrient_table_record_fields',
        'v3_nutrient_table_record_id',
        { transaction },
      );
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
