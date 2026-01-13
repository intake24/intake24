import { createPermissions, updateSequence } from '../../utils.js';

const permissions = [{ name: 'surveys|securables', display_name: 'Surveys security' }];

const permissionToDelete = ['surveyadmin', 'surveys|mgmt'];

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('surveys', 'v3_surveys', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_surveys RENAME CONSTRAINT surveys_id_characters TO v3_surveys_id_characters;`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE v3_surveys RENAME CONSTRAINT surveys_id_pk TO v3_surveys_id_pk;`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE v3_surveys RENAME CONSTRAINT surveys_maximum_daily_submissions_at_least_one TO v3_surveys_maximum_daily_submissions_at_least_one;`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE v3_surveys RENAME CONSTRAINT surveys_name_key TO v3_surveys_name_key;`,
        { transaction },
      );
      await queryInterface.removeIndex('v3_surveys', 'surveys_survey_scheme_id_idx', {
        transaction,
      });

      await queryInterface.createTable(
        'surveys',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          slug: {
            allowNull: false,
            type: Sequelize.STRING(128),
            unique: true,
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          state: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
          start_date: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          end_date: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          locale_id: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          survey_scheme_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          feedback_scheme_id: {
            allowNull: true,
            type: Sequelize.BIGINT,
          },
          allow_gen_users: {
            allowNull: true,
            type: Sequelize.BOOLEAN,
          },
          gen_user_key: {
            allowNull: true,
            type: Sequelize.STRING(256),
          },
          support_email: {
            allowNull: true,
            type: Sequelize.STRING(512),
          },
          suspension_reason: {
            allowNull: true,
            type: Sequelize.STRING(512),
          },
          survey_monkey_url: {
            allowNull: true,
            type: Sequelize.STRING(512),
          },
          originating_url: {
            allowNull: true,
            type: Sequelize.STRING(512),
          },
          submission_notification_url: {
            allowNull: true,
            type: Sequelize.STRING(2048),
          },
          store_user_session_on_server: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
          },
          number_of_submissions_for_feedback: {
            allowNull: false,
            type: Sequelize.INTEGER,
            defaultValue: 1,
          },
          maximum_daily_submissions: {
            allowNull: false,
            type: Sequelize.INTEGER,
            defaultValue: 3,
          },
          minimum_submission_interval: {
            allowNull: false,
            type: Sequelize.INTEGER,
            defaultValue: 600,
          },
          maximum_total_submissions: {
            allowNull: true,
            type: Sequelize.INTEGER,
          },
          auth_url_domain_override: {
            allowNull: true,
            type: Sequelize.STRING(512),
          },
          auth_url_token_charset: {
            allowNull: true,
            type: Sequelize.STRING(128),
          },
          auth_url_token_length: {
            allowNull: true,
            type: Sequelize.INTEGER,
          },
          survey_scheme_overrides: {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          search_sorting_algorithm: {
            allowNull: false,
            type: Sequelize.STRING(32),
            defaultValue: 'popularity',
          },
          search_match_score_weight: {
            allowNull: false,
            type: Sequelize.INTEGER,
            defaultValue: 20,
          },
          user_personal_identifiers: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          user_custom_fields: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
            defaultValue: false,
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

      await queryInterface.addIndex('surveys', ['slug'], {
        name: 'surveys_slug_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['name'], {
        name: 'surveys_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('surveys', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'surveys_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['locale_id'], {
        name: 'surveys_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('surveys', {
        fields: ['survey_scheme_id'],
        type: 'foreign key',
        references: {
          table: 'survey_schemes',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'surveys_survey_scheme_id_fk',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['survey_scheme_id'], {
        name: 'surveys_survey_scheme_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('surveys', {
        fields: ['feedback_scheme_id'],
        type: 'foreign key',
        references: {
          table: 'feedback_schemes',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'surveys_feedback_scheme_id_fk',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['feedback_scheme_id'], {
        name: 'surveys_feedback_scheme_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('surveys', {
        fields: ['owner_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'surveys_owner_id_fk',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['owner_id'], {
        name: 'surveys_owner_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO surveys (slug, name, state, start_date, end_date, locale_id, survey_scheme_id, feedback_scheme_id, allow_gen_users, gen_user_key, support_email, suspension_reason, survey_monkey_url, originating_url, submission_notification_url, store_user_session_on_server, number_of_submissions_for_feedback, maximum_daily_submissions, minimum_submission_interval, maximum_total_submissions, auth_url_domain_override, auth_url_token_charset, auth_url_token_length, survey_scheme_overrides, search_sorting_algorithm, search_match_score_weight, created_at, updated_at) SELECT id, "name", state, start_date, end_date, locale_id, survey_scheme_id, feedback_scheme_id, allow_gen_users, gen_user_key, support_email, suspension_reason, survey_monkey_url, originating_url, submission_notification_url, store_user_session_on_server, number_of_submissions_for_feedback, maximum_daily_submissions, minimum_submission_interval, maximum_total_submissions, auth_url_domain_override, auth_url_token_charset, auth_url_token_length, overrides, search_sorting_algorithm, search_match_score_weight, current_timestamp, current_timestamp FROM v3_surveys',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE surveys SET state = 'notStarted' WHERE state = '0';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE surveys SET state = 'active' WHERE state = '1';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE surveys SET state = 'suspended' WHERE state = '2';`,
        { transaction },
      );

      await createPermissions(permissions, { queryInterface, transaction });

      await queryInterface.sequelize.query(
        `INSERT INTO permission_user (permission_id, user_id, created_at, updated_at)
          SELECT distinct pp.id, pu.user_id, current_timestamp, current_timestamp
          FROM permissions p
          JOIN permission_user pu on p.id = pu.permission_id
          CROSS JOIN (select id from permissions p2 WHERE p2."name" = 'surveys') as pp
          WHERE (p."name" like '%/staff' or p."name" like '%/support')`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO user_securables (user_id, securable_id, securable_type, action, fields, created_at, updated_at)
          SELECT pu.user_id, s.id, 'Survey', a.new_action, a.fields, current_timestamp, current_timestamp
          FROM permissions p
          JOIN permission_user pu on p.id = pu.permission_id
          JOIN surveys s on split_part(p."name", '/', 1) = s.slug
          JOIN (values
            ('staff', 'read', null),
            ('staff', 'overrides', null),
            ('staff', 'respondents', null),
            ('staff', 'submissions', null),
            ('staff', 'data-export', null),
            ('support', 'support', null))
            AS a (old_action, new_action, fields)
            on split_part(p."name", '/', 2) = a.old_action
          WHERE (p."name" like '%/staff' or p."name" like '%/support');`,
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

      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE "name" LIKE '%/staff';`, {
        transaction,
      });

      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE "name" LIKE '%/support';`,
        { transaction },
      );

      // client_error_reports
      await queryInterface.renameTable('client_error_reports', 'v4dep_client_error_reports', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v4dep_client_error_reports RENAME CONSTRAINT client_error_reports_pkey TO v4dep_client_error_reports_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE client_error_reports_id_seq RENAME TO v4dep_client_error_reports_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'client_error_reports',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          survey_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          stack_trace: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: false,
          },
          survey_state_json: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: false,
          },
          new: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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

      await queryInterface.addConstraint('client_error_reports', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'client_error_reports_survey_id_fk',
        transaction,
      });

      await queryInterface.addIndex('client_error_reports', ['survey_id'], {
        name: 'client_error_reports_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('client_error_reports', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'client_error_reports_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('client_error_reports', ['user_id'], {
        name: 'client_error_reports_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO client_error_reports (id, user_id, survey_id, stack_trace, survey_state_json, "new", created_at, updated_at) SELECT v4depcer.id, CAST(v4depcer.user_id as BIGINT), s.id, v4depcer.stack_trace, v4depcer.survey_state_json, v4depcer."new", v4depcer.reported_at, v4depcer.reported_at FROM v4dep_client_error_reports v4depcer LEFT JOIN surveys s ON v4depcer.survey_id = s.slug`,
        { transaction },
      );

      await updateSequence('client_error_reports', 'id', { queryInterface, transaction });

      // gen_user_counters
      await queryInterface.renameTable('gen_user_counters', 'v3_gen_user_counters', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_gen_user_counters RENAME CONSTRAINT gen_user_counters_pkey TO v3_gen_user_counters_pkey;`,
        { transaction },
      );

      await queryInterface.createTable(
        'gen_user_counters',
        {
          survey_id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          count: {
            allowNull: false,
            type: Sequelize.INTEGER,
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
        'INSERT INTO gen_user_counters (survey_id, count, created_at, updated_at) SELECT s.id, v3guc.count, current_timestamp, current_timestamp FROM v3_gen_user_counters v3guc JOIN surveys s ON v3guc.survey_id = s.slug',
        { transaction },
      );

      await queryInterface.addConstraint('gen_user_counters', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'gen_user_counters_survey_id_fk',
        transaction,
      });

      // missing_foods
      await queryInterface.renameTable('missing_foods', 'v4dep_missing_foods', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE v4dep_missing_foods RENAME CONSTRAINT missing_foods_pkey TO v4dep_missing_foods_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE missing_foods_id_seq RENAME TO v4dep_missing_foods_id_seq;',
        { transaction },
      );

      await queryInterface.removeIndex('v4dep_survey_submissions', 'missing_foods_survey_id_idx', {
        transaction,
      });

      await queryInterface.removeIndex('v4dep_survey_submissions', 'missing_foods_user_id_idx', {
        transaction,
      });

      await queryInterface.createTable(
        'missing_foods',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          survey_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          user_id: {
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
          submitted_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('missing_foods', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'missing_foods_survey_id_fk',
        transaction,
      });

      await queryInterface.addIndex('missing_foods', ['survey_id'], {
        name: 'missing_foods_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('missing_foods', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'missing_foods_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('missing_foods', ['user_id'], {
        name: 'missing_foods_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO missing_foods (id, survey_id, user_id, "name", brand, description, portion_size, leftovers, submitted_at) SELECT v4depmf.id, s.id, v4depmf.user_id, v4depmf."name", v4depmf.brand, v4depmf.description, v4depmf.portion_size, v4depmf.leftovers, v4depmf.submitted_at FROM v4dep_missing_foods v4depmf JOIN surveys s ON v4depmf.survey_id = s.slug',
        { transaction },
      );

      await updateSequence('missing_foods', 'id', { queryInterface, transaction });

      // survey_submissions
      await queryInterface.renameTable('survey_submissions', 'v4dep_survey_submissions', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v4dep_survey_submissions RENAME CONSTRAINT survey_submissions_pkey TO v4dep_survey_submissions_pkey;`,
        { transaction },
      );

      await queryInterface.removeIndex(
        'v4dep_survey_submissions',
        'survey_submissions_survey_id_idx',
        { transaction },
      );

      await queryInterface.removeIndex(
        'v4dep_survey_submissions',
        'survey_submissions_user_id_idx',
        { transaction },
      );

      await queryInterface.createTable(
        'survey_submissions',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
          },
          survey_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          start_time: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          end_time: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          submission_time: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          log: {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          ux_session_id: {
            allowNull: false,
            type: Sequelize.UUID,
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
        'INSERT INTO survey_submissions (id, survey_id, user_id, start_time, end_time, submission_time, log, ux_session_id, created_at, updated_at) SELECT v4depss.id, s.id, v4depss.user_id, v4depss.start_time, v4depss.end_time, v4depss.submission_time, v4depss.log, v4depss.ux_session_id, current_timestamp, current_timestamp FROM v4dep_survey_submissions v4depss JOIN surveys s ON v4depss.survey_id = s.slug',
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

      await queryInterface.removeConstraint(
        'survey_submission_custom_fields',
        'survey_submission_custom_fields_survey_submission_id_fk',
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

      await queryInterface.removeConstraint(
        'survey_submission_meals',
        'survey_submission_meals_survey_submission_id_fk',
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

      // surveys_ux_events_settings
      await queryInterface.renameTable(
        'surveys_ux_events_settings',
        'v3_surveys_ux_events_settings',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_surveys_ux_events_settings RENAME CONSTRAINT surveys_ux_events_settings_pkey TO v3_surveys_ux_events_settings_pkey;`,
        { transaction },
      );

      await queryInterface.createTable(
        'surveys_ux_events_settings',
        {
          survey_id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          enable_search_events: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
          },
          enable_associated_foods_events: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
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
        'INSERT INTO surveys_ux_events_settings (survey_id, enable_search_events, enable_associated_foods_events, created_at, updated_at) SELECT s.id, v3sues.enable_search_events, v3sues.enable_associated_foods_events, current_timestamp, current_timestamp FROM v3_surveys_ux_events_settings v3sues JOIN surveys s ON v3sues.survey_id = s.slug',
        { transaction },
      );

      await queryInterface.addConstraint('surveys_ux_events_settings', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'surveys_ux_events_settings_survey_id_fk',
        transaction,
      });

      // user_notification_schedule
      await queryInterface.renameTable(
        'user_notification_schedule',
        'v4dep_user_notification_schedule',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v4dep_user_notification_schedule RENAME CONSTRAINT user_notification_schedule_pkey TO v4dep_user_notification_schedule_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE user_notification_schedule_id_seq RENAME TO v4dep_user_notification_schedule_id_seq;',
        { transaction },
      );

      await queryInterface.removeIndex(
        'v4dep_user_notification_schedule',
        'user_notification_schedule_survey_id_idx',
        { transaction },
      );

      await queryInterface.removeIndex(
        'v4dep_user_notification_schedule',
        'user_notification_schedule_user_id_idx',
        { transaction },
      );

      await queryInterface.createTable(
        'user_notification_schedule',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          survey_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          datetime: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          notification_type: {
            type: Sequelize.STRING(128),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('user_notification_schedule', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_notification_schedule_survey_id_fk',
        transaction,
      });

      await queryInterface.addIndex('user_notification_schedule', ['survey_id'], {
        name: 'user_notification_schedule_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('user_notification_schedule', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_notification_schedule_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('user_notification_schedule', ['user_id'], {
        name: 'user_notification_schedule_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO user_notification_schedule (id, user_id, survey_id, datetime, notification_type) SELECT v4depuns.id, v4depuns.user_id, s.id, v4depuns.datetime, v4depuns.notification_type FROM v4dep_user_notification_schedule v4depuns LEFT JOIN surveys s ON v4depuns.survey_id = s.slug`,
        { transaction },
      );

      await updateSequence('user_notification_schedule', 'id', { queryInterface, transaction });

      // user_sessions
      await queryInterface.renameTable('user_sessions', 'v4dep_user_sessions', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v4dep_user_sessions RENAME CONSTRAINT user_sessions_pkey TO v4dep_user_sessions_pkey;`,
        { transaction },
      );

      await queryInterface.createTable(
        'user_survey_sessions',
        {
          user_id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          survey_id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          session_data: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
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
        'INSERT INTO user_survey_sessions (user_id, survey_id, session_data, created_at, updated_at) SELECT v4depus.user_id, s.id, v4depus.session_data, v4depus.created_at, v4depus.updated_at FROM v4dep_user_sessions v4depus JOIN surveys s ON v4depus.survey_id = s.slug',
        { transaction },
      );

      await queryInterface.addConstraint('user_survey_sessions', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_survey_sessions_survey_id_fk',
        transaction,
      });

      await queryInterface.addConstraint('user_survey_sessions', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_survey_sessions_user_id_fk',
        transaction,
      });

      // user_survey_aliases
      await queryInterface.renameTable('user_survey_aliases', 'v3_user_survey_aliases', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_user_survey_aliases RENAME CONSTRAINT user_aliases_pkey TO v3_user_aliases_pkey;`,
        { transaction },
      );

      await queryInterface.createTable(
        'user_survey_aliases',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          survey_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          username: {
            allowNull: false,
            type: Sequelize.STRING(256),
          },
          url_auth_token: {
            allowNull: false,
            type: Sequelize.STRING(128),
            unique: true,
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
        'INSERT INTO user_survey_aliases (user_id, survey_id, username, url_auth_token, created_at, updated_at) SELECT v3usa.user_id, s.id, v3usa.user_name, v3usa.url_auth_token, current_timestamp, current_timestamp FROM v3_user_survey_aliases v3usa JOIN surveys s ON v3usa.survey_id = s.slug',
        { transaction },
      );

      await queryInterface.addConstraint('user_survey_aliases', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'restrict',
        onDelete: 'cascade',
        name: 'user_survey_aliases_survey_id_fk',
        transaction,
      });

      await queryInterface.addIndex('user_survey_aliases', ['survey_id'], {
        name: 'user_survey_aliases_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('user_survey_aliases', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_survey_aliases_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('user_survey_aliases', ['user_id'], {
        name: 'user_survey_aliases_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('user_survey_aliases', {
        fields: ['survey_id', 'username'],
        type: 'unique',
        name: 'user_survey_aliases_survey_id_username_unique',
        transaction,
      });

      await queryInterface.dropTable('v4dep_client_error_reports', { transaction });
      await queryInterface.dropTable('v3_gen_user_counters', { transaction });
      await queryInterface.dropTable('v4dep_missing_foods', { transaction });
      await queryInterface.dropTable('v4dep_survey_submissions', { transaction });
      await queryInterface.dropTable('v3_surveys_ux_events_settings', { transaction });
      await queryInterface.dropTable('v4dep_user_notification_schedule', { transaction });
      await queryInterface.dropTable('v4dep_user_sessions', { transaction });
      await queryInterface.dropTable('v3_user_survey_aliases', { transaction });
      await queryInterface.dropTable('data_export_downloads', { transaction });
      await queryInterface.dropTable('data_export_scheduled', { transaction });
      await queryInterface.dropTable('data_export_tasks', { transaction });
      await queryInterface.dropTable('v3_surveys', { transaction });
      await queryInterface.dropTable('v4dep_schemes', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
