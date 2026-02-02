/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Sequelize's sync will create separate enums following the naming convention: enum_<table>_<column>
      // Match that behaviour here to keep it compatible with Kysely (a single shared enum makes more sense otherwise)
      await queryInterface.sequelize.query(
        `CREATE TYPE enum_category_portion_size_methods_pathways AS ENUM ('addon', 'afp', 'recipe', 'search');`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `CREATE TYPE enum_food_portion_size_methods_pathways AS ENUM ('addon', 'afp', 'recipe', 'search');`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE category_portion_size_methods ADD COLUMN pathways_temp enum_category_portion_size_methods_pathways[];`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE food_portion_size_methods ADD COLUMN pathways_temp enum_food_portion_size_methods_pathways[];`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_portion_size_methods SET pathways_temp = ARRAY(SELECT jsonb_array_elements_text(pathways))::enum_category_portion_size_methods_pathways[];`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_portion_size_methods SET pathways_temp = ARRAY(SELECT jsonb_array_elements_text(pathways))::enum_food_portion_size_methods_pathways[];`,
        { transaction },
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.removeColumn(table, 'pathways', { transaction }),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.renameColumn(table, 'pathways_temp', 'pathways', { transaction }),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN pathways SET NOT NULL;`,
            { transaction },
          )),
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ADD COLUMN pathways_temp JSONB;`,
            { transaction },
          )),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET pathways_temp = to_jsonb(pathways);`,
            { transaction },
          )),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.removeColumn(table, 'pathways', { transaction }),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.renameColumn(table, 'pathways_temp', 'pathways', { transaction }),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN pathways SET NOT NULL;`,
            { transaction },
          )),
      );

      await queryInterface.sequelize.query(
        `DROP TYPE enum_category_portion_size_methods_pathways;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DROP TYPE enum_food_portion_size_methods_pathways;`,
        { transaction },
      );
    }),
};
