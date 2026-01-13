import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('survey_submissions', 'v3_survey_submissions', {
        transaction,
      });

      await queryInterface.createTable(
        'survey_submissions',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          survey_id: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          start_time: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          end_time: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          submission_time: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          log: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: true,
          },
          ux_session_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submissions', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'survey_submissions_survey_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submissions', ['survey_id'], {
        name: 'survey_submissions_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('survey_submissions', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'survey_submissions_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_submissions', ['user_id'], {
        name: 'survey_submissions_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO survey_submissions (id, survey_id, user_id, start_time, end_time, log, ux_session_id, submission_time) SELECT id, survey_id, user_id, start_time, end_time, array_to_string(log, E'\n'), ux_session_id, submission_time FROM v3_survey_submissions`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submissions SET log = NULL WHERE log = '';`,
        { transaction },
      );

      await queryInterface.renameTable(
        'survey_submission_custom_fields',
        'v3_survey_submission_custom_fields',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_custom_fields_id_seq RENAME TO v3_survey_submission_custom_fields_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_custom_fields',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
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
        'INSERT INTO survey_submission_custom_fields (id, survey_submission_id, "name", value) SELECT id, survey_submission_id, "name", value FROM v3_survey_submission_custom_fields',
        { transaction },
      );

      await updateSequence('survey_submission_custom_fields', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable('survey_submission_meals', 'v3_survey_submission_meals', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_meals_id_seq RENAME TO v3_survey_submission_meals_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_meals',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
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
        'INSERT INTO survey_submission_meals (id, survey_submission_id, hours, minutes, "name") SELECT id, survey_submission_id, hours, minutes, "name" FROM v3_survey_submission_meals',
        { transaction },
      );

      await updateSequence('survey_submission_meals', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable(
        'survey_submission_meal_custom_fields',
        'v3_survey_submission_meal_custom_fields',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_meal_custom_fields_id_seq RENAME TO v3_survey_submission_meal_custom_fields_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_meal_custom_fields',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          meal_id: {
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_meal_custom_fields (id, meal_id, "name", value) SELECT id, meal_id, "name", value FROM v3_survey_submission_meal_custom_fields',
        { transaction },
      );

      await updateSequence('survey_submission_meal_custom_fields', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable(
        'survey_submission_missing_foods',
        'v3_survey_submission_missing_foods',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_missing_foods_id_seq RENAME TO v3_survey_submission_missing_foods_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_missing_foods',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          meal_id: {
            type: Sequelize.BIGINT,
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_missing_foods (id, meal_id, "name", brand, description, portion_size, leftovers) SELECT id, meal_id, "name", brand, description, portion_size, leftovers FROM v3_survey_submission_missing_foods',
        { transaction },
      );

      await updateSequence('survey_submission_missing_foods', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable('survey_submission_foods', 'v3_survey_submission_foods', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_foods_id_seq RENAME TO v3_survey_submission_foods_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_foods',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          meal_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          code: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          english_description: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          local_description: {
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
          food_group_english_description: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          food_group_local_description: {
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_foods (id, meal_id, code, english_description, local_description, ready_meal, search_term, portion_size_method_id, reasonable_amount, food_group_id, food_group_english_description, food_group_local_description, brand, nutrient_table_id, nutrient_table_code) SELECT id, meal_id, code, english_description, local_description, ready_meal, search_term, portion_size_method_id, reasonable_amount, food_group_id, food_group_english_description, food_group_local_description, brand, nutrient_table_id, nutrient_table_code FROM v3_survey_submission_foods',
        { transaction },
      );

      await updateSequence('survey_submission_foods', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable(
        'survey_submission_food_custom_fields',
        'v3_survey_submission_food_custom_fields',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_food_custom_fields_id_seq RENAME TO v3_survey_submission_food_custom_fields_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_food_custom_fields',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_id: {
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_food_custom_fields (id, food_id, "name", value) SELECT id, food_id, "name", value FROM v3_survey_submission_food_custom_fields',
        { transaction },
      );

      await updateSequence('survey_submission_food_custom_fields', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable('survey_submission_fields', 'v3_survey_submission_fields', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_fields_id_seq RENAME TO v3_survey_submission_fields_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_fields',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_id: {
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_fields (id, food_id, field_name, value) SELECT id, food_id, field_name, value FROM v3_survey_submission_fields',
        { transaction },
      );

      await updateSequence('survey_submission_fields', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable(
        'survey_submission_nutrients',
        'v3_survey_submission_nutrients',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_nutrients_id_seq RENAME TO v3_survey_submission_nutrients_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_nutrients',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_id: {
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_nutrients (id, food_id, amount, nutrient_type_id) SELECT id, food_id, amount, nutrient_type_id FROM v3_survey_submission_nutrients',
        { transaction },
      );

      await updateSequence('survey_submission_nutrients', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable(
        'survey_submission_portion_size_fields',
        'v3_survey_submission_portion_size_fields',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE survey_submission_portion_size_fields_id_seq RENAME TO v3_survey_submission_portion_size_fields_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submission_portion_size_fields',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_id: {
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

      await queryInterface.sequelize.query(
        'INSERT INTO survey_submission_portion_size_fields (id, food_id, "name", value) SELECT id, food_id, "name", value FROM v3_survey_submission_portion_size_fields',
        { transaction },
      );

      await updateSequence('survey_submission_portion_size_fields', 'id', {
        queryInterface,
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
