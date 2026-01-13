/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // categories
      await queryInterface.renameTable('categories', 'old_categories', { transaction });
      await queryInterface.sequelize.query(`ALTER INDEX categories_name_idx RENAME TO old_categories_name_idx;`, { transaction });

      // category_locals
      await queryInterface.renameTable('category_locals', 'categories', { transaction });

      await queryInterface.sequelize.query(`ALTER SEQUENCE category_locals_id_seq RENAME TO categories_id_seq;`, { transaction });

      await queryInterface.addColumn('categories', 'english_name', { allowNull: true, type: Sequelize.STRING(256) }, { transaction });
      await queryInterface.addColumn('categories', 'hidden', { allowNull: true, type: Sequelize.BOOLEAN }, { transaction });
      await queryInterface.renameColumn('categories', 'category_code', 'code', { transaction });

      await queryInterface.sequelize.query(
        `UPDATE categories SET english_name = old_categories.name, hidden = old_categories.is_hidden FROM old_categories WHERE categories.code = old_categories.code;`,
        { transaction },
      );

      await queryInterface.changeColumn('categories', 'code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('categories', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('categories', 'english_name', { allowNull: false, type: Sequelize.STRING(256) }, { transaction });
      await queryInterface.changeColumn('categories', 'hidden', { allowNull: false, type: Sequelize.BOOLEAN }, { transaction });
      await queryInterface.removeConstraint('categories', 'category_locals_category_code_fk', { transaction });

      await Promise.all([
        queryInterface.sequelize.query(`ALTER TABLE categories RENAME CONSTRAINT category_locals_pkey TO categories_pkey;`, { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE categories RENAME CONSTRAINT category_locals_unique TO categories_unique;`, { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE categories RENAME CONSTRAINT category_locals_locale_id_fk TO categories_locale_id_fk;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX category_locals_category_code_idx RENAME TO categories_code_idx;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX category_locals_locale_id_idx RENAME TO categories_locale_id_idx;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX category_locals_name_idx RENAME TO categories_name_idx;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX category_locals_simple_name_idx RENAME TO categories_simple_name_idx;`, { transaction }),
      ]);

      // category attributes
      await queryInterface.renameTable('category_attributes', 'old_category_attributes', { transaction });
      await queryInterface.sequelize.query(`ALTER TABLE old_category_attributes RENAME CONSTRAINT category_attributes_pkey TO old_category_attributes_pkey;`, { transaction });

      await queryInterface.createTable(
        'category_attributes',
        {
          category_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
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

      await queryInterface.addConstraint('category_attributes', {
        fields: ['category_id'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'category_attributes_category_id_fk',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO category_attributes (category_id, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes)
          SELECT categories.id, old_ca.same_as_before_option, old_ca.ready_meal_option, old_ca.reasonable_amount, old_ca.use_in_recipes FROM old_category_attributes old_ca
          JOIN categories ON old_ca.category_code = categories.code;
        `,
        { transaction },
      );

      // categories_categories
      await queryInterface.renameTable('categories_categories', 'old_categories_categories', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE old_categories_categories RENAME CONSTRAINT categories_categories_subcategory_code_category_code_pk TO old_categories_categories_subcategory_code_category_code_pk;`,
        { transaction },
      );

      await queryInterface.createTable(
        'categories_categories',
        {
          category_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          sub_category_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('categories_categories', {
        fields: ['category_id', 'sub_category_id'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('categories_categories', {
        fields: ['category_id'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('categories_categories', {
        fields: ['sub_category_id'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('categories_categories', ['category_id'], {
        name: 'categories_categories_category_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('categories_categories', ['sub_category_id'], {
        name: 'categories_categories_sub_category_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO categories_categories (category_id, sub_category_id) SELECT c1.id, c2.id FROM old_categories_categories old_cc
        JOIN categories c1 ON old_cc.category_code = c1.code
        JOIN categories c2 ON old_cc.subcategory_code = c2.code AND c1.locale_id = c2.locale_id;
          `,
        { transaction },
      );

      // category_portion_size_methods
      await queryInterface.renameColumn('category_portion_size_methods', 'category_local_id', 'category_id', { transaction });

      await Promise.all([
        queryInterface.sequelize.query(`ALTER TABLE category_portion_size_methods RENAME CONSTRAINT category_portion_size_methods_category_local_id_fk TO category_portion_size_methods_category_id_fk;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX category_portion_size_methods_category_local_id_idx RENAME TO category_portion_size_methods_category_id_idx;`, { transaction }),
      ]);

      // foods
      await queryInterface.renameTable('foods', 'old_foods', { transaction });
      await queryInterface.sequelize.query(`ALTER INDEX foods_name_idx RENAME TO old_foods_name_idx;`, { transaction });

      // food_locals
      await queryInterface.renameTable('food_locals', 'foods', { transaction });

      await queryInterface.sequelize.query(`ALTER SEQUENCE food_locals_id_seq RENAME TO foods_id_seq;`, { transaction });

      await queryInterface.addColumn('foods', 'english_name', { allowNull: true, type: Sequelize.STRING(256) }, { transaction });
      await queryInterface.renameColumn('foods', 'food_code', 'code', { transaction });

      await queryInterface.sequelize.query(
        `UPDATE foods SET english_name = old_foods.name FROM old_foods WHERE foods.code = old_foods.code;`,
        { transaction },
      );

      await queryInterface.changeColumn('foods', 'code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('foods', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('foods', 'english_name', { allowNull: false, type: Sequelize.STRING(256) }, { transaction });
      await queryInterface.removeConstraint('foods', 'food_locals_food_code_fk', { transaction });

      await Promise.all([
        queryInterface.sequelize.query(`ALTER TABLE foods RENAME CONSTRAINT food_locals_pkey TO foods_pkey;`, { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE foods RENAME CONSTRAINT food_locals_unique TO foods_unique;`, { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE foods RENAME CONSTRAINT food_locals_locale_id_fk TO foods_locale_id_fk;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX food_locals_food_code_idx RENAME TO foods_code_idx;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX food_locals_locale_id_idx RENAME TO foods_locale_id_idx;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX food_locals_name_idx RENAME TO foods_name_idx;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX food_locals_simple_name_idx RENAME TO foods_simple_name_idx;`, { transaction }),
      ]);

      // food attributes
      await queryInterface.renameTable('food_attributes', 'old_food_attributes', { transaction });
      await queryInterface.sequelize.query(`ALTER TABLE old_food_attributes RENAME CONSTRAINT food_attributes_pkey TO old_food_attributes_pkey;`, { transaction });

      await queryInterface.createTable(
        'food_attributes',
        {
          food_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
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

      await queryInterface.addConstraint('food_attributes', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'food_attributes_food_id_fk',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO food_attributes (food_id, same_as_before_option, ready_meal_option, reasonable_amount, use_in_recipes)
          SELECT foods.id, old_fa.same_as_before_option, old_fa.ready_meal_option, old_fa.reasonable_amount, old_fa.use_in_recipes FROM old_food_attributes old_fa
          JOIN foods ON old_fa.food_code = foods.code;
        `,
        { transaction },
      );

      // foods_categories
      await queryInterface.renameTable('foods_categories', 'old_foods_categories', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE old_foods_categories RENAME CONSTRAINT foods_categories_food_code_category_code_pk TO old_foods_categories_food_code_category_code_pk;`,
        { transaction },
      );

      await queryInterface.createTable(
        'foods_categories',
        {
          food_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          category_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('foods_categories', {
        fields: ['food_id', 'category_id'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('foods_categories', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('foods_categories', {
        fields: ['category_id'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('foods_categories', ['food_id'], {
        name: 'foods_categories_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('foods_categories', ['category_id'], {
        name: 'foods_categories_category_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO foods_categories (food_id, category_id) SELECT foods.id, categories.id FROM old_foods_categories old_fc
        JOIN foods ON old_fc.food_code = foods.code
        JOIN categories ON old_fc.category_code = categories.code AND foods.locale_id = categories.locale_id;`,
        { transaction },
      );

      // foods_nutrients / food_portion_size_methods
      await Promise.all([
        queryInterface.renameColumn('food_portion_size_methods', 'food_local_id', 'food_id', { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE food_portion_size_methods RENAME CONSTRAINT food_portion_size_methods_food_local_id_fk TO food_portion_size_methods_food_id_fk;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX food_portion_size_methods_food_local_id_idx RENAME TO food_portion_size_methods_food_id_idx;`, { transaction }),
        queryInterface.renameColumn('foods_nutrients', 'food_local_id', 'food_id', { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE foods_nutrients RENAME CONSTRAINT foods_nutrients_nutrient_table_record_id_food_local_id_pk TO foods_nutrients_nutrient_table_record_id_food_id_pk;`, { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE foods_nutrients RENAME CONSTRAINT foods_nutrients_food_local_id_food_locals_fk TO foods_nutrients_food_id_foods_fk;`, { transaction }),
        queryInterface.sequelize.query(`ALTER INDEX foods_nutrients_food_local_id_idx RENAME TO foods_nutrients_food_id_idx;`, { transaction }),
      ]);

      // food_thumbnail_images
      await Promise.all([
        queryInterface.renameColumn('food_thumbnail_images', 'food_local_id', 'food_id', { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE food_thumbnail_images RENAME CONSTRAINT food_thumbnail_images_food_local_id_key TO food_thumbnail_images_food_id_key;`, { transaction }),
        queryInterface.sequelize.query(`ALTER TABLE food_thumbnail_images RENAME CONSTRAINT food_thumbnail_images_food_local_id_fkey TO food_thumbnail_images_food_id_fkey;`, { transaction }),
        /* Remove duplicate index created by 20250204153931-create_food_thumbnail_images.js
         - references on column already create an index
        */
        queryInterface.removeIndex('food_thumbnail_images', 'food_thumbnail_images_food_local_id', { transaction }),
      ]);

      // associated_foods

      // Codes not globally unique anymore -> cannot be FK
      // TODO: do we keep associated_food_code/associated_category_code as CODEs or convert to IDs?
      await queryInterface.removeConstraint('associated_foods', 'associated_foods_associated_category_code_fk', { transaction });
      await queryInterface.removeConstraint('associated_foods', 'associated_foods_associated_food_code_fk', { transaction });

      await queryInterface.changeColumn('associated_foods', 'associated_category_code', { allowNull: true, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('associated_foods', 'associated_food_code', { allowNull: true, type: Sequelize.STRING(64) }, { transaction });

      await queryInterface.removeConstraint('associated_foods', 'associated_foods_food_code_fk', { transaction });
      await queryInterface.removeConstraint('associated_foods', 'associated_foods_locale_id_fk', { transaction });

      await queryInterface.addColumn('associated_foods', 'food_id', { allowNull: true, type: Sequelize.BIGINT }, { transaction });
      // await queryInterface.addColumn('associated_foods', 'associated_category_id', { allowNull: true, type: Sequelize.BIGINT }, { transaction });
      // await queryInterface.addColumn('associated_foods', 'associated_food_id', { allowNull: true, type: Sequelize.BIGINT }, { transaction });

      await queryInterface.sequelize.query(
        `UPDATE associated_foods SET food_id = foods.id FROM foods WHERE associated_foods.food_code = foods.code AND associated_foods.locale_id = foods.locale_id;`,
        { transaction },
      );

      /* await queryInterface.sequelize.query(
        `UPDATE associated_foods af
          SET associated_category_id = afc.id
          FROM categories afc
          WHERE af.associated_category_code IS NOT NULL AND af.associated_category_code = afc.code AND afc.locale_id = af.locale_id;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE associated_foods af
          SET associated_food_id = aff.id
          FROM foods aff
          JOIN foods f ON af.food_id = f.id
          WHERE af.associated_food_id IS NOT NULL AND af.associated_food_id = aff.code AND aff.locale_id = f.locale_id;`,
        { transaction },
      ); */

      await queryInterface.changeColumn('associated_foods', 'food_id', { allowNull: false, type: Sequelize.BIGINT }, { transaction });
      await queryInterface.removeColumn('associated_foods', 'food_code', { transaction });
      await queryInterface.removeColumn('associated_foods', 'locale_id', { transaction });
      // await queryInterface.removeColumn('associated_foods', 'associated_category_code', { transaction });
      // await queryInterface.removeColumn('associated_foods', 'associated_food_code', { transaction });

      await queryInterface.addConstraint('associated_foods', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['food_id'], {
        name: 'associated_foods_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      /* await queryInterface.addConstraint('associated_foods', {
        fields: ['associated_category_id'],
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['associated_category_id'], {
        name: 'associated_foods_associated_category_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('associated_foods', {
        fields: ['associated_food_id'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('associated_foods', ['associated_food_id'], {
        name: 'associated_foods_associated_food_id_idx',
        indexType: 'btree',
        transaction,
      }); */

      // brands
      await queryInterface.removeConstraint('brands', 'brands_food_code_fk', { transaction });
      await queryInterface.removeConstraint('brands', 'brands_locale_id_fk', { transaction });

      await queryInterface.addColumn('brands', 'food_id', { allowNull: true, type: Sequelize.BIGINT }, { transaction });

      await queryInterface.sequelize.query(
        `UPDATE brands SET food_id = foods.id FROM foods WHERE brands.food_code = foods.code AND brands.locale_id = foods.locale_id;`,
        { transaction },
      );

      await queryInterface.changeColumn('brands', 'food_id', { allowNull: false, type: Sequelize.BIGINT }, { transaction });
      await queryInterface.removeColumn('brands', 'food_code', { transaction });
      await queryInterface.removeColumn('brands', 'locale_id', { transaction });

      await queryInterface.addConstraint('brands', {
        fields: ['food_id'],
        type: 'foreign key',
        references: {
          table: 'foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('brands', ['food_id'], {
        name: 'brands_food_id_idx',
        indexType: 'btree',
        transaction,
      });

      // recipe_foods
      await queryInterface.changeColumn('recipe_foods', 'code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('recipe_foods', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.removeConstraint('recipe_foods_steps', 'category_foods_code_fk', { transaction });
      await queryInterface.changeColumn('recipe_foods_steps', 'category_code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });
      await queryInterface.changeColumn('recipe_foods_steps', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction });

      await Promise.all([
        queryInterface.dropTable('foods_local_lists', { transaction }),
        queryInterface.dropTable('foods_restrictions', { transaction }),
        queryInterface.dropTable('old_category_attributes', { transaction }),
        queryInterface.dropTable('old_categories_categories', { transaction }),
        queryInterface.dropTable('old_food_attributes', { transaction }),
        queryInterface.dropTable('old_foods_categories', { transaction }),
        queryInterface.dropTable('old_categories', { transaction }),
        queryInterface.dropTable('old_foods', { transaction }),
      ]);

      await Promise.all([
        queryInterface.changeColumn('locales', 'id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('split_lists', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('split_words', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('synonym_sets', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
      ]);
    });
  },

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
