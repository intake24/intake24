import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('foods_attributes', 'v3_foods_attributes', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_foods_attributes RENAME CONSTRAINT foods_attributes_pk TO v3_foods_attributes_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE foods_attributes_id_seq RENAME TO v3_foods_attributes_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'food_attributes',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_code: {
            type: Sequelize.STRING(8),
            allowNull: false,
          },
          same_as_before_option: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          ready_meal_option: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          reasonable_amount: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          use_in_recipes: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('food_attributes', {
        fields: ['food_code'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'food_attributes_food_code_fk',
        transaction,
      });

      await queryInterface.addIndex('food_attributes', ['food_code'], {
        name: 'food_attributes_food_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO food_attributes (id, food_code, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes) SELECT id, food_code, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes FROM v3_foods_attributes',
        { transaction },
      );

      await updateSequence('food_attributes', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('foods_categories', 'v3_foods_categories', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_foods_categories RENAME CONSTRAINT foods_categories_pk TO v3_foods_categories_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_foods_categories RENAME CONSTRAINT foods_categories_unique TO v3_foods_categories_unique;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE foods_categories_id_seq RENAME TO v3_foods_categories_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'foods_categories',
        {
          food_code: {
            allowNull: false,
            type: Sequelize.STRING(8),
          },
          category_code: {
            allowNull: false,
            type: Sequelize.STRING(8),
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('foods_categories', {
        fields: ['food_code', 'category_code'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('foods_categories', {
        fields: ['food_code'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('foods_categories', {
        fields: ['category_code'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('foods_categories', ['food_code'], {
        name: 'foods_categories_food_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('foods_categories', ['category_code'], {
        name: 'foods_categories_category_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO foods_categories (food_code, category_code) SELECT food_code, category_code FROM v3_foods_categories',
        { transaction },
      );

      await queryInterface.renameTable('food_groups', 'v3_food_groups', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_food_groups RENAME CONSTRAINT food_groups_id_pk TO v3_food_groups_id_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE food_groups_id_seq RENAME TO v3_food_groups_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'food_groups',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('food_groups', ['name'], {
        name: 'food_groups_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO food_groups (id, name) SELECT id, description FROM v3_food_groups',
        { transaction },
      );

      await updateSequence('food_groups', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('food_groups_local', 'v3_food_groups_local', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_food_groups_local RENAME CONSTRAINT food_groups_local_pk TO v3_food_groups_local_pk;`,
        { transaction },
      );

      await queryInterface.createTable(
        'food_group_locals',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_group_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('food_group_locals', {
        fields: ['food_group_id'],
        type: 'foreign key',
        references: {
          table: 'food_groups',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'food_group_locals_food_group_id_fk',
        transaction,
      });

      await queryInterface.addIndex('food_group_locals', ['food_group_id'], {
        name: 'food_group_locals_food_group_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('food_group_locals', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'food_group_locals_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('food_group_locals', ['locale_id'], {
        name: 'food_group_locals_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('food_group_locals', ['name'], {
        name: 'food_group_locals_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO food_group_locals (food_group_id, locale_id, name) SELECT food_group_id, locale_id, local_description FROM v3_food_groups_local',
        { transaction },
      );

      await queryInterface.renameColumn('foods', 'description', 'name', { transaction });

      await queryInterface.addIndex('foods', ['name'], {
        name: 'foods_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.changeColumn(
        'foods',
        'food_group_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.renameTable('food_nutrient_mapping', 'v3_food_nutrient_mapping', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_food_nutrient_mapping RENAME CONSTRAINT food_nutrient_mapping_pkey1 TO v3_food_nutrient_mapping_pkey1;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE food_nutrient_mapping_id_seq1 RENAME TO v3_food_nutrient_mapping_id_seq1;',
        { transaction },
      );

      await queryInterface.createTable(
        'foods_nutrients',
        {
          food_local_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          nutrient_table_record_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('foods_nutrients', {
        fields: ['nutrient_table_record_id', 'food_local_id'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('foods_nutrients', {
        fields: ['food_local_id'],
        type: 'foreign key',
        references: {
          table: 'food_locals',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('foods_nutrients', {
        fields: ['nutrient_table_record_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_table_records',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('foods_nutrients', ['food_local_id'], {
        name: 'foods_nutrients_food_local_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('foods_nutrients', ['nutrient_table_record_id'], {
        name: 'foods_nutrients_nutrient_table_record_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO foods_nutrients (food_local_id, nutrient_table_record_id) SELECT food_local_id, nutrient_table_record_id FROM v3_food_nutrient_mapping',
        { transaction },
      );

      await queryInterface.renameTable('brands', 'v3_brands', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_brands RENAME CONSTRAINT brands_pk TO v3_brands_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE brands_id_seq RENAME TO v3_brands_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'brands',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_code: {
            type: Sequelize.STRING(8),
            allowNull: false,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('brands', {
        fields: ['food_code'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'brands_food_code_fk',
        transaction,
      });

      await queryInterface.addIndex('brands', ['food_code'], {
        name: 'brands_food_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('brands', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'brands_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('brands', ['locale_id'], {
        name: 'brands_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('brands', ['food_code', 'locale_id'], {
        name: 'brands_food_code_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('brands', ['name'], {
        name: 'brands_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO brands (id, food_code, locale_id, name) SELECT id, food_code, locale_id, name FROM v3_brands',
        { transaction },
      );

      await updateSequence('brands', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('attribute_defaults', 'v3_attribute_defaults', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_attribute_defaults RENAME CONSTRAINT attribute_defaults_pk TO v3_attribute_defaults_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE attribute_defaults_id_seq RENAME TO v3_attribute_defaults_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'attribute_defaults',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          same_as_before_option: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          ready_meal_option: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          reasonable_amount: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          use_in_recipes: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO attribute_defaults (id, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes) SELECT id, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes FROM v3_attribute_defaults',
        { transaction },
      );

      await updateSequence('attribute_defaults', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('associated_foods', 'v3_associated_foods', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_associated_foods RENAME CONSTRAINT associated_food_prompts_pk TO v3_associated_food_prompts_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_associated_foods RENAME CONSTRAINT either_food_or_category TO v3_either_food_or_category;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE associated_foods_id_seq RENAME TO v3_associated_foods_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'associated_foods',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          food_code: {
            type: Sequelize.STRING(8),
            allowNull: false,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          associated_food_code: {
            type: Sequelize.STRING(8),
            allowNull: true,
          },
          associated_category_code: {
            type: Sequelize.STRING(8),
            allowNull: true,
          },
          text: {
            type: Sequelize.STRING(1024),
            allowNull: false,
          },
          link_as_main: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          generic_name: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('associated_foods', {
        fields: ['food_code'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'associated_foods_food_code_fk',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['food_code'], {
        name: 'associated_foods_food_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('associated_foods', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'associated_foods_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['locale_id'], {
        name: 'associated_foods_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['food_code', 'locale_id'], {
        name: 'associated_foods_food_code_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('associated_foods', {
        fields: ['associated_food_code'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'associated_foods_associated_food_code_fk',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['associated_food_code'], {
        name: 'associated_foods_associated_food_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('associated_foods', {
        fields: ['associated_category_code'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'associated_foods_associated_category_code_fk',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['associated_category_code'], {
        name: 'associated_foods_associated_category_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO associated_foods (id, food_code, locale_id, associated_food_code, associated_category_code, text, link_as_main, generic_name) SELECT id, food_code, locale_id, associated_food_code, associated_category_code, text, link_as_main, generic_name FROM v3_associated_foods',
        { transaction },
      );

      await updateSequence('associated_foods', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
