import { createPermissions } from '../../utils.js';

const permissions = [
  { name: 'languages|securables', display_name: 'Languages security' },
  { name: 'locales|copy', display_name: 'Copy locales' },
  { name: 'locales|food-list', display_name: 'Locale food list' },
  { name: 'locales|securables', display_name: 'Locales security' },
];

const permissionToDelete = [
  'foodsadmin',
  'fdbs|browse',
  'fdbs|read',
  'fdbs|create',
  'fdbs|edit',
  'fdbs|delete',
];

export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('languages', 'old_languages', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE old_languages RENAME CONSTRAINT languages_pkey TO old_languages_pkey;`,
        { transaction },
      );

      await queryInterface.createTable(
        'languages',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          code: {
            allowNull: false,
            type: Sequelize.STRING(8),
            unique: true,
          },
          english_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          local_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          country_flag_code: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          text_direction: {
            allowNull: false,
            defaultValue: 'ltr',
            type: Sequelize.STRING(16),
          },
          owner_id: {
            allowNull: true,
            type: Sequelize.BIGINT,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO languages (code, english_name, local_name, country_flag_code, text_direction, created_at, updated_at) SELECT id, english_name, local_name, country_flag_code, text_direction, created_at, updated_at FROM old_languages',
        { transaction },
      );

      await queryInterface.addConstraint('languages', {
        fields: ['owner_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'languages_owner_id_fk',
        transaction,
      });

      await queryInterface.addIndex('languages', ['owner_id'], {
        name: 'languages_owner_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.removeConstraint(
        'language_translations',
        'language_translations_language_id_fk',
        { transaction },
      );

      await queryInterface.removeConstraint(
        'language_translations',
        'language_translations_unique',
        { transaction },
      );

      await queryInterface.addColumn(
        'language_translations',
        'old_language_id',
        { allowNull: true, type: Sequelize.STRING(8) },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE language_translations SET old_language_id = language_id;`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'language_translations',
        'language_id',
        { type: Sequelize.STRING(8), allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE language_translations SET language_id = NULL;`, {
        transaction,
      });

      queryInterface.sequelize.query(
        `ALTER TABLE language_translations ALTER COLUMN language_id TYPE bigint USING language_id::bigint;`,
        { transaction },
      );

      queryInterface.sequelize.query(
        'UPDATE language_translations SET language_id = languages.id FROM languages WHERE language_translations.old_language_id = languages.code;',
        { transaction },
      );

      await queryInterface.addConstraint('language_translations', {
        fields: ['language_id'],
        name: 'language_translations_language_id_fk',
        type: 'foreign key',
        references: {
          table: 'languages',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('language_translations', {
        fields: ['language_id', 'application', 'section'],
        type: 'unique',
        name: 'language_translations_unique',
        transaction,
      });

      await queryInterface.removeColumn('language_translations', 'old_language_id', {
        transaction,
      });

      await queryInterface.renameTable('locales', 'old_locales', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE old_locales RENAME CONSTRAINT locales_pk TO old_locales_pk;`,
        { transaction },
      );

      await queryInterface.createTable(
        'locales',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          code: {
            allowNull: false,
            type: Sequelize.STRING(16),
            unique: true,
          },
          english_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          local_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          respondent_language_id: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          admin_language_id: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          country_flag_code: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          prototype_locale_id: {
            allowNull: true,
            type: Sequelize.STRING(16),
          },
          text_direction: {
            allowNull: false,
            defaultValue: 'ltr',
            type: Sequelize.STRING(16),
          },
          food_index_language_backend_id: {
            allowNull: false,
            defaultValue: 'en',
            type: Sequelize.STRING(16),
          },
          owner_id: {
            allowNull: true,
            type: Sequelize.BIGINT,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO locales (code, english_name, local_name, respondent_language_id, admin_language_id, country_flag_code, prototype_locale_id, text_direction, food_index_language_backend_id, created_at, updated_at) SELECT id, english_name, local_name, respondent_language_id, admin_language_id, country_flag_code, prototype_locale_id, text_direction, food_index_language_backend_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM old_locales',
        { transaction },
      );

      await queryInterface.addConstraint('locales', {
        fields: ['admin_language_id'],
        name: 'locales_admin_language_id_fk',
        type: 'foreign key',
        references: {
          table: 'languages',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });

      await queryInterface.addConstraint('locales', {
        fields: ['respondent_language_id'],
        name: 'locales_respondent_language_id_fk',
        type: 'foreign key',
        references: {
          table: 'languages',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });

      await queryInterface.addConstraint('locales', {
        fields: ['prototype_locale_id'],
        name: 'locales_prototype_locale_id_fk',
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('locales', {
        fields: ['food_index_language_backend_id'],
        name: 'locales_food_index_language_backend_id_fk',
        type: 'foreign key',
        references: {
          table: 'food_index_language_backends',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });

      await queryInterface.removeConstraint('surveys', 'surveys_user_id_fk', {
        transaction,
      });

      await queryInterface.addColumn(
        'surveys',
        'old_locale_id',
        { allowNull: true, type: Sequelize.STRING(16) },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE surveys SET old_locale_id = locale_id;`, {
        transaction,
      });

      await queryInterface.changeColumn(
        'surveys',
        'locale_id',
        { type: Sequelize.STRING(16), allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE surveys SET locale_id = NULL;`, {
        transaction,
      });

      queryInterface.sequelize.query(
        `ALTER TABLE surveys ALTER COLUMN locale_id TYPE bigint USING locale_id::bigint;`,
        { transaction },
      );

      queryInterface.sequelize.query(
        'UPDATE surveys SET locale_id = locales.id FROM locales WHERE surveys.old_locale_id = locales.code;',
        { transaction },
      );

      await queryInterface.addConstraint('surveys', {
        fields: ['locale_id'],
        name: 'surveys_locale_id_fk',
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });

      await queryInterface.removeColumn('surveys', 'old_locale_id', { transaction });

      await queryInterface.removeConstraint('fixed_food_ranking', 'fixed_food_ranking_locale_fk', {
        transaction,
      });

      await queryInterface.addConstraint('fixed_food_ranking', {
        fields: ['locale_id'],
        name: 'fixed_food_ranking_locale_id_fk',
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.dropTable('old_locales', { transaction });
      await queryInterface.dropTable('old_languages', { transaction });

      await createPermissions(permissions, { queryInterface, transaction });

      await queryInterface.sequelize.query(
        `INSERT INTO permission_user (permission_id, user_id, created_at, updated_at)
          SELECT distinct pp.id, pu.user_id, current_timestamp, current_timestamp
          FROM permissions p
          JOIN permission_user pu on p.id = pu.permission_id
          CROSS JOIN (select id from permissions p2 WHERE p2."name" = 'locales') as pp
          WHERE p."name" like 'fdbm/%';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO user_securables (user_id, securable_id, securable_type, action, fields, created_at, updated_at)
          SELECT pu.user_id, l.id, 'Locale', a.new_action, a.fields, current_timestamp, current_timestamp
          FROM permissions p
          JOIN permission_user pu on p.id = pu.permission_id
          JOIN locales l on split_part(p."name", '/', 2) = l.code
          JOIN (values ('fdbm', 'food-list', null))
            AS a (old_action, new_action, fields)
            on split_part(p."name", '/', 1) = a.old_action
          WHERE p."name" like 'fdbm/%';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE "name" IN (:permissions);`,
        {
          type: queryInterface.sequelize.QueryTypes.DELETE,
          replacements: { permissions: permissionToDelete },
          transaction,
        },
      );
    }),

  down: async () => {
    throw new Error('This migration cannot be undone');
  },
};
