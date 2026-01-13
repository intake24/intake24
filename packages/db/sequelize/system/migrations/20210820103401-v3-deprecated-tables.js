export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('local_fields', 'v3_local_fields', { transaction });
      await queryInterface.renameTable('local_nutrient_types', 'v3_local_nutrient_types', {
        transaction,
      });

      await queryInterface.renameTable('flyway_migrations', 'v3_flyway_migrations', {
        transaction,
      });
      await queryInterface.renameTable('schema_version', 'v3_schema_version', { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('v3_local_fields', 'local_fields', { transaction });
      await queryInterface.renameTable('v3_local_nutrient_types', 'local_nutrient_types', {
        transaction,
      });

      await queryInterface.renameTable('v3_flyway_migrations', 'flyway_migrations', {
        transaction,
      });
      await queryInterface.renameTable('v3_schema_version', 'schema_version', { transaction });
    }),
};
