export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('nutrient_table_record_fields', ['nutrient_table_record_id'], {
        name: 'nutrient_table_record_fields_table_record_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex(
        'nutrient_table_record_nutrients',
        ['nutrient_table_record_id'],
        {
          name: 'nutrient_table_record_nutrients_table_record_id_idx',
          indexType: 'btree',
          transaction,
        },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'nutrient_table_record_fields',
        'nutrient_table_record_fields_table_record_id_idx',
        { transaction },
      );

      await queryInterface.removeIndex(
        'nutrient_table_record_nutrients',
        'nutrient_table_record_nutrients_table_record_id_idx',
        { transaction },
      );
    }),
};
