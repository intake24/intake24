import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('categories', 'description', 'name', { transaction });

      await queryInterface.addIndex('categories', ['name'], {
        name: 'categories_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'update categories_local set local_description = c.name, simple_local_description = lower(c.name) FROM categories c where category_code = c.code and local_description is null;',
        { transaction },
      );

      await queryInterface.renameTable('categories_attributes', 'v3_categories_attributes', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_categories_attributes RENAME CONSTRAINT categories_attributes_pk TO v3_categories_attributes_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE categories_attributes_id_seq RENAME TO v3_categories_attributes_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'category_attributes',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          category_code: {
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

      await queryInterface.addConstraint('category_attributes', {
        fields: ['category_code'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'category_attributes_category_code_fk',
        transaction,
      });

      await queryInterface.addIndex('category_attributes', ['category_code'], {
        name: 'category_attributes_category_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO category_attributes (id, category_code, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes) SELECT id, category_code, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes FROM v3_categories_attributes',
        { transaction },
      );

      await updateSequence('category_attributes', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('categories_categories', 'v3_categories_categories', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_categories_categories RENAME CONSTRAINT categories_categories_pk TO v3_categories_categories_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_categories_categories RENAME CONSTRAINT categories_categories_unique TO v3_categories_categories_unique;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE categories_categories_id_seq RENAME TO v3_categories_categories_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'categories_categories',
        {
          subcategory_code: {
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

      await queryInterface.addConstraint('categories_categories', {
        fields: ['subcategory_code', 'category_code'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('categories_categories', {
        fields: ['subcategory_code'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('categories_categories', {
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

      await queryInterface.addIndex('categories_categories', ['subcategory_code'], {
        name: 'categories_categories_subcategory_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('categories_categories', ['category_code'], {
        name: 'categories_categories_category_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO categories_categories (subcategory_code, category_code) SELECT subcategory_code, category_code FROM v3_categories_categories',
        { transaction },
      );

      await queryInterface.renameTable('categories_local', 'v3_categories_local', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_categories_local RENAME CONSTRAINT categories_local_pk TO v3_categories_local_pk;`,
        { transaction },
      );

      await queryInterface.createTable(
        'category_locals',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          category_code: {
            type: Sequelize.STRING(8),
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
          simple_name: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          version: {
            type: Sequelize.UUID,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('category_locals', {
        fields: ['category_code'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'category_locals_category_code_fk',
        transaction,
      });

      await queryInterface.addIndex('category_locals', ['category_code'], {
        name: 'category_locals_category_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('category_locals', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'category_locals_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('category_locals', ['locale_id'], {
        name: 'category_locals_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('category_locals', {
        fields: ['category_code', 'locale_id'],
        type: 'unique',
        name: 'category_locals_unique',
        transaction,
      });

      await queryInterface.addIndex('category_locals', ['name'], {
        name: 'category_locals_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('category_locals', ['simple_name'], {
        name: 'category_locals_simple_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO category_locals (category_code, locale_id, name, simple_name, version) SELECT category_code, locale_id, local_description, simple_local_description, version FROM v3_categories_local',
        { transaction },
      );

      await queryInterface.renameTable(
        'categories_portion_size_methods',
        'v3_categories_portion_size_methods',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_categories_portion_size_methods RENAME CONSTRAINT categories_portion_size_methods_pk TO v3_categories_portion_size_methods_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE categories_portion_size_methods_id_seq RENAME TO v3_categories_portion_size_methods_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'category_portion_size_methods',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          category_local_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          category_code: {
            type: Sequelize.STRING(8),
            allowNull: false,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          method: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          image_url: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          use_for_recipes: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          conversion_factor: {
            type: Sequelize.FLOAT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('category_portion_size_methods', {
        fields: ['category_local_id'],
        type: 'foreign key',
        references: {
          table: 'category_locals',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'category_portion_size_methods_category_local_id_fk',
        transaction,
      });

      await queryInterface.addIndex('category_portion_size_methods', ['category_local_id'], {
        name: 'category_portion_size_methods_category_local_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO category_portion_size_methods (id, category_code, locale_id, "method", description, image_url, use_for_recipes, conversion_factor) SELECT id, category_code, locale_id, "method", description, image_url, use_for_recipes, conversion_factor FROM v3_categories_portion_size_methods',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'UPDATE category_portion_size_methods SET category_local_id = category_locals.id from category_locals WHERE category_portion_size_methods.category_code = category_locals.category_code AND category_portion_size_methods.locale_id = category_locals.locale_id',
        { transaction },
      );

      await queryInterface.changeColumn(
        'category_portion_size_methods',
        'category_local_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeColumn('category_portion_size_methods', 'category_code', {
        transaction,
      });

      await queryInterface.removeColumn('category_portion_size_methods', 'locale_id', {
        transaction,
      });

      await updateSequence('category_portion_size_methods', 'id', { queryInterface, transaction });

      await queryInterface.renameTable(
        'categories_portion_size_method_params',
        'v3_categories_portion_size_method_params',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_categories_portion_size_method_params RENAME CONSTRAINT categories_portion_size_method_params_pk TO v3_categories_portion_size_method_params_pk;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE categories_portion_size_method_params_id_seq RENAME TO v3_categories_portion_size_method_params_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'category_portion_size_method_params',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          portion_size_method_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('category_portion_size_method_params', {
        fields: ['portion_size_method_id'],
        type: 'foreign key',
        references: {
          table: 'category_portion_size_methods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'category_portion_size_method_params_portion_size_method_id_fk',
        transaction,
      });

      await queryInterface.addIndex(
        'category_portion_size_method_params',
        ['portion_size_method_id'],
        {
          name: 'category_portion_size_method_params_portion_size_method_id_idx',
          indexType: 'btree',
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO category_portion_size_method_params (id, portion_size_method_id, "name", value) SELECT id, portion_size_method_id, "name", value FROM v3_categories_portion_size_method_params',
        { transaction },
      );

      await updateSequence('category_portion_size_method_params', 'id', {
        queryInterface,
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
