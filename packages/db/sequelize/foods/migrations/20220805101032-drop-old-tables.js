export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('demographic_group_scale_sectors', { transaction });
      await queryInterface.dropTable('demographic_groups', { transaction });
      await queryInterface.dropTable('five_a_day_feedback', { transaction });
      await queryInterface.dropTable('flyway_migrations', { transaction });
      await queryInterface.dropTable('food_groups_feedback_nutrient_ids', { transaction });
      await queryInterface.dropTable('food_groups_feedback', { transaction });
      await queryInterface.dropTable('schema_version', { transaction });

      await queryInterface.dropTable('v3_as_served_images', { transaction });
      await queryInterface.dropTable('v3_associated_foods', { transaction });
      await queryInterface.dropTable('v3_attribute_defaults', { transaction });
      await queryInterface.dropTable('v3_brands', { transaction });
      await queryInterface.dropTable('v3_categories_attributes', { transaction });
      await queryInterface.dropTable('v3_categories_categories', { transaction });
      await queryInterface.dropTable('v3_categories_local', { transaction });
      await queryInterface.dropTable('v3_categories_portion_size_method_params', { transaction });
      await queryInterface.dropTable('v3_categories_portion_size_methods', { transaction });
      await queryInterface.dropTable('v3_demographic_group_scale_sector', { transaction });
      await queryInterface.dropTable('v3_demographic_group', { transaction });
      await queryInterface.dropTable('v3_drinkware_volume_samples', { transaction });
      await queryInterface.dropTable('v3_drinkware_scales', { transaction });
      await queryInterface.dropTable('v3_food_groups_local', { transaction });
      await queryInterface.dropTable('v3_food_groups', { transaction });
      await queryInterface.dropTable('v3_food_nutrient_mapping', { transaction });
      await queryInterface.dropTable('v3_food_nutrient_mapping_1', { transaction });
      await queryInterface.dropTable('v3_food_portion_size_method_params', { transaction });
      await queryInterface.dropTable('v3_foods_attributes', { transaction });
      await queryInterface.dropTable('v3_foods_categories', { transaction });
      await queryInterface.dropTable('v3_foods_local', { transaction });
      await queryInterface.dropTable('v3_foods_nutrient_mapping', { transaction });
      await queryInterface.dropTable('v3_foods_portion_size_methods', { transaction });
      await queryInterface.dropTable('v3_guide_image_objects', { transaction });
      await queryInterface.dropTable('v3_image_map_objects', { transaction });
      await queryInterface.dropTable('v3_nutrient_table_csv_mapping_field_columns', {
        transaction,
      });
      await queryInterface.dropTable('v3_nutrient_table_csv_mapping_nutrient_columns', {
        transaction,
      });
      await queryInterface.dropTable('v3_nutrient_table_records_fields', { transaction });
      await queryInterface.dropTable('v3_nutrient_table_records_nutrients', { transaction });
      await queryInterface.dropTable('v3_nutrient_table_records', { transaction });
      await queryInterface.dropTable('v3_nutrient_type_in_kcal', { transaction });
      await queryInterface.dropTable('v3_nutrient_types', { transaction });
      await queryInterface.dropTable('v3_nutrient_units', { transaction });
      await queryInterface.dropTable('v3_physical_activity_levels', { transaction });
      await queryInterface.dropTable('v3_processed_images', { transaction });
      await queryInterface.dropTable('v3_source_images', { transaction });
      await queryInterface.dropTable('v3_split_list', { transaction });
      await queryInterface.dropTable('v3_split_words', { transaction });
      await queryInterface.dropTable('v3_synonym_sets', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
