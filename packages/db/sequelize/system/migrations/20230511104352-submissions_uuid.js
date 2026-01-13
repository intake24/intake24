export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_custom_fields RENAME CONSTRAINT survey_submission_custom_fields_pkey TO survey_submission_custom_fields_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_custom_fields',
        'survey_submission_custom_fields_survey_submission_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_custom_fields',
        'survey_submission_custom_fields_survey_submission_id_idx',
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_custom_fields',
        'survey_submission_custom_fields_old',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_custom_fields',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          survey_submission_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_custom_fields', {
        fields: ['survey_submission_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submissions',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_custom_fields_survey_submission_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_custom_fields', ['survey_submission_id'], {
        name: 'survey_submission_custom_fields_survey_submission_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_custom_fields (id, survey_submission_id, "name", value) SELECT uuid_generate_v4(), survey_submission_id, "name", value FROM survey_submission_custom_fields_old',
        { transaction },
      );

      // Meals
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_meals RENAME CONSTRAINT survey_submission_meals_pkey TO survey_submission_meals_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_meals',
        'survey_submission_meals_survey_submission_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_meals',
        'survey_submission_meals_survey_submission_id_idx',
        { transaction },
      );

      await queryInterface.renameTable('survey_submission_meals', 'survey_submission_meals_old', {
        transaction,
      });

      await queryInterface.createTable(
        'survey_submission_meals',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          survey_submission_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          hours: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          minutes: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_meals', {
        fields: ['survey_submission_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submissions',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_meals_survey_submission_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_meals', ['survey_submission_id'], {
        name: 'survey_submission_meals_survey_submission_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_meals (id, id_old, survey_submission_id, hours, minutes, "name") SELECT uuid_generate_v4(), id, survey_submission_id, hours, minutes, "name" FROM survey_submission_meals_old',
        { transaction },
      );

      // Meals custom fields
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_meal_custom_fields RENAME CONSTRAINT survey_submission_meal_custom_fields_pkey TO survey_submission_meal_custom_fields_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_meal_custom_fields',
        'survey_submission_meal_custom_fields_meal_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_meal_custom_fields',
        'survey_submission_meal_custom_fields_meal_id_idx',
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_meal_custom_fields',
        'survey_submission_meal_custom_fields_old',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_meal_custom_fields',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          meal_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          meal_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_meal_custom_fields (id, meal_id_old, "name", value) SELECT uuid_generate_v4(), meal_id, "name", value FROM survey_submission_meal_custom_fields_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_meal_custom_fields SET meal_id = survey_submission_meals.id FROM survey_submission_meals WHERE meal_id_old = survey_submission_meals.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_meal_custom_fields',
        'meal_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_meal_custom_fields', {
        fields: ['meal_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_meals',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_meal_custom_fields_meal_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_meal_custom_fields', ['meal_id'], {
        name: 'survey_submission_meal_custom_fields_meal_id_idx',
        indexType: 'btree',
        transaction,
      });

      // Missing foods
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_missing_foods RENAME CONSTRAINT survey_submission_missing_foods_pkey TO survey_submission_missing_foods_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_missing_foods',
        'survey_submission_missing_foods_meal_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_missing_foods',
        'survey_submission_missing_foods_meal_id_idx',
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_missing_foods',
        'survey_submission_missing_foods_old',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_missing_foods',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          parent_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          meal_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          meal_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          index: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          brand: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          portion_size: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          leftovers: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_missing_foods (id, index, meal_id_old, "name", brand, description, portion_size, leftovers) SELECT uuid_generate_v4(), id, meal_id, "name", brand, description, portion_size, leftovers FROM survey_submission_missing_foods_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_missing_foods SET meal_id = survey_submission_meals.id FROM survey_submission_meals WHERE meal_id_old = survey_submission_meals.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_missing_foods',
        'meal_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addIndex('survey_submission_missing_foods', ['parent_id'], {
        name: 'survey_submission_missing_foods_parent_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_missing_foods', ['index'], {
        name: 'survey_submission_missing_foods_index_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('survey_submission_missing_foods', {
        fields: ['meal_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_meals',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_missing_foods_meal_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_missing_foods', ['meal_id'], {
        name: 'survey_submission_missing_foods_meal_id_idx',
        indexType: 'btree',
        transaction,
      });

      // Foods
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_foods RENAME CONSTRAINT survey_submission_foods_pkey TO survey_submission_foods_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_foods',
        'survey_submission_foods_meal_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_foods',
        'survey_submission_foods_meal_id_idx',
        { transaction },
      );

      await queryInterface.renameTable('survey_submission_foods', 'survey_submission_foods_old', {
        transaction,
      });

      await queryInterface.createTable(
        'survey_submission_foods',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          parent_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          meal_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          meal_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          index: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          code: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          english_name: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          local_name: {
            type: Sequelize.STRING(256),
            allowNull: true,
          },
          ready_meal: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          search_term: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          portion_size_method_id: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          reasonable_amount: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          food_group_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          food_group_english_name: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          food_group_local_name: {
            type: Sequelize.STRING(256),
            allowNull: true,
          },
          brand: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
          nutrient_table_id: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          nutrient_table_code: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_foods (id, id_old, index, meal_id_old, code, english_name, local_name, ready_meal, search_term, portion_size_method_id, reasonable_amount, food_group_id, food_group_english_name, food_group_local_name, brand, nutrient_table_id, nutrient_table_code) SELECT uuid_generate_v4(), id, id, meal_id, code, english_name, local_name, ready_meal, search_term, portion_size_method_id, reasonable_amount, food_group_id, food_group_english_name, food_group_local_name, brand, nutrient_table_id, nutrient_table_code FROM survey_submission_foods_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods SET meal_id = survey_submission_meals.id FROM survey_submission_meals WHERE meal_id_old = survey_submission_meals.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_foods',
        'meal_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_foods', {
        fields: ['parent_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_foods_parent_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_foods', ['parent_id'], {
        name: 'survey_submission_foods_parent_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_foods', ['index'], {
        name: 'survey_submission_foods_index_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('survey_submission_foods', {
        fields: ['meal_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_meals',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_foods_meal_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_foods', ['meal_id'], {
        name: 'survey_submission_foods_meal_id_idx',
        indexType: 'btree',
        transaction,
      });

      // Foods custom fields
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_food_custom_fields RENAME CONSTRAINT survey_submission_food_custom_fields_pkey TO survey_submission_food_custom_fields_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_food_custom_fields',
        'survey_submission_food_custom_fields_food_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_food_custom_fields',
        'survey_submission_food_custom_fields_food_id_idx',
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_food_custom_fields',
        'survey_submission_food_custom_fields_old',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_food_custom_fields',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          food_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          food_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_food_custom_fields (id, food_id_old, "name", value) SELECT uuid_generate_v4(), food_id, "name", value FROM survey_submission_food_custom_fields_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_food_custom_fields SET food_id = survey_submission_foods.id FROM survey_submission_foods WHERE food_id_old = survey_submission_foods.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_food_custom_fields',
        'food_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_food_custom_fields', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_food_custom_fields_food_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_food_custom_fields', ['food_id'], {
        name: 'survey_submission_food_custom_fields_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      // Foods fields
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_fields RENAME CONSTRAINT survey_submission_fields_pkey TO survey_submission_fields_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_fields',
        'survey_submission_fields_food_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_fields',
        'survey_submission_fields_food_id_idx',
        { transaction },
      );

      await queryInterface.renameTable('survey_submission_fields', 'survey_submission_fields_old', {
        transaction,
      });

      await queryInterface.createTable(
        'survey_submission_fields',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          food_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          food_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          field_name: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_fields (id, food_id_old, field_name, value) SELECT uuid_generate_v4(), food_id, field_name, value FROM survey_submission_fields_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_fields SET food_id = survey_submission_foods.id FROM survey_submission_foods WHERE food_id_old = survey_submission_foods.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_fields',
        'food_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_fields', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_fields_food_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_fields', ['food_id'], {
        name: 'survey_submission_fields_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      // Foods nutrients
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_nutrients RENAME CONSTRAINT survey_submission_nutrients_pkey TO survey_submission_nutrients_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_nutrients',
        'survey_submission_nutrients_food_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_nutrients',
        'survey_submission_nutrients_food_id_idx',
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_nutrients',
        'survey_submission_nutrients_nutrient_type_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_nutrients',
        'survey_submission_nutrients_nutrient_type_id_idx',
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_nutrients',
        'survey_submission_nutrients_old',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_nutrients',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          food_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          food_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          amount: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          nutrient_type_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_nutrients (id, food_id_old, amount, nutrient_type_id) SELECT uuid_generate_v4(), food_id, amount, nutrient_type_id FROM survey_submission_nutrients_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_nutrients SET food_id = survey_submission_foods.id FROM survey_submission_foods WHERE food_id_old = survey_submission_foods.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_nutrients',
        'food_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_nutrients', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_nutrients_food_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_nutrients', ['food_id'], {
        name: 'survey_submission_nutrients_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('survey_submission_nutrients', {
        fields: ['nutrient_type_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'no action',
        onDelete: 'no action',
        name: 'survey_submission_nutrients_nutrient_type_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_nutrients', ['nutrient_type_id'], {
        name: 'survey_submission_nutrients_nutrient_type_id_idx',
        indexType: 'btree',
        transaction,
      });

      // Foods portion size fields
      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_portion_size_fields RENAME CONSTRAINT survey_submission_portion_size_fields_pkey TO survey_submission_portion_size_fields_pkey_old;`,
        { transaction },
      );

      await queryInterface.removeConstraint(
        'survey_submission_portion_size_fields',
        'survey_submission_portion_size_fields_food_id_fk',
        { transaction },
      );

      await queryInterface.removeIndex(
        'survey_submission_portion_size_fields',
        'survey_submission_portion_size_fields_food_id_idx',
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_portion_size_fields',
        'survey_submission_portion_size_fields_old',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_portion_size_fields',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          food_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          food_id_old: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_portion_size_fields (id, food_id_old, "name", value) SELECT uuid_generate_v4(), food_id, "name", value FROM survey_submission_portion_size_fields_old',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_portion_size_fields SET food_id = survey_submission_foods.id FROM survey_submission_foods WHERE food_id_old = survey_submission_foods.id_old;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_portion_size_fields',
        'food_id',
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_portion_size_fields', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'survey_submission_foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'survey_submission_portion_size_fields_food_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_portion_size_fields', ['food_id'], {
        name: 'survey_submission_portion_size_fields_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_portion_size_fields', 'food_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_nutrients', 'food_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_fields', 'food_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_food_custom_fields', 'food_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_foods', 'id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_foods', 'meal_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_missing_foods', 'meal_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_meal_custom_fields', 'meal_id_old', {
        transaction,
      });

      await queryInterface.removeColumn('survey_submission_meals', 'id_old', {
        transaction,
      });

      await queryInterface.dropTable('survey_submission_portion_size_fields_old', { transaction });
      await queryInterface.dropTable('survey_submission_nutrients_old', { transaction });
      await queryInterface.dropTable('survey_submission_fields_old', { transaction });
      await queryInterface.dropTable('survey_submission_food_custom_fields_old', { transaction });
      await queryInterface.dropTable('survey_submission_foods_old', { transaction });
      await queryInterface.dropTable('survey_submission_missing_foods_old', { transaction });
      await queryInterface.dropTable('survey_submission_meal_custom_fields_old', { transaction });
      await queryInterface.dropTable('survey_submission_meals_old', { transaction });
      await queryInterface.dropTable('survey_submission_custom_fields_old', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
