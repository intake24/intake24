import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('users', 'v3_users', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_users RENAME CONSTRAINT users_pkey TO v3_users_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query('ALTER SEQUENCE user_id_seq RENAME TO v3_user_id_seq;', {
        transaction,
      });

      await queryInterface.createTable(
        'users',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
          email: {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
          phone: {
            type: Sequelize.STRING(32),
            allowNull: true,
          },
          simple_name: {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
          email_notifications: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          sms_notifications: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          multi_factor_authentication: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('users', ['email'], {
        name: 'users_email_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('users', ['simple_name'], {
        name: 'users_simple_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO users (id, "name", email, phone, simple_name, email_notifications, sms_notifications, multi_factor_authentication, created_at, updated_at) SELECT id, "name", email, phone, simple_name, email_notifications, sms_notifications, multi_factor_authentication, current_timestamp, current_timestamp FROM v3_users',
        { transaction },
      );

      await updateSequence('users', 'id', { queryInterface, transaction });

      await queryInterface.changeColumn(
        'user_survey_aliases',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.changeColumn(
        'user_survey_aliases',
        'survey_id',
        { type: Sequelize.STRING(64), allowNull: false },
        { transaction },
      );

      await queryInterface.changeColumn(
        'user_survey_aliases',
        'url_auth_token',
        { type: Sequelize.STRING(128), allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint('user_survey_aliases', 'user_aliases_user_id_fkey', {
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

      await queryInterface.removeConstraint(
        'user_subscriptions',
        'user_subscriptions_user_id_users_fk',
        { transaction },
      );

      await queryInterface.addConstraint('user_subscriptions', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_subscriptions_user_id_fk',
        transaction,
      });

      await queryInterface.removeConstraint('user_sessions', 'user_sessions_user_id_users_fk', {
        transaction,
      });

      await queryInterface.addConstraint('user_sessions', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_sessions_user_id_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'user_physical_data',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint('user_physical_data', 'users_id_fk', {
        transaction,
      });

      await queryInterface.addConstraint('user_physical_data', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'no action',
        name: 'user_physical_data_user_id_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'user_passwords',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint('user_passwords', 'user_passwords_user_id_fkey', {
        transaction,
      });

      await queryInterface.addConstraint('user_passwords', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_passwords_user_id_fk',
        transaction,
      });

      await queryInterface.removeConstraint(
        'user_password_resets',
        'user_password_resets_user_id_users_fk',
        { transaction },
      );

      await queryInterface.addConstraint('user_password_resets', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_password_resets_user_id_fk',
        transaction,
      });

      await queryInterface.renameTable('user_custom_fields', 'v3_user_custom_fields', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE user_custom_fields_id_seq RENAME TO v3_user_custom_fields_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'user_custom_fields',
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
          name: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('user_custom_fields', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_custom_fields_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('user_custom_fields', ['user_id'], {
        name: 'user_custom_fields_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO user_custom_fields (id, user_id, "name", value) SELECT id, user_id, "name", value FROM v3_user_custom_fields',
        { transaction },
      );

      await updateSequence('user_custom_fields', 'id', { queryInterface, transaction });

      await queryInterface.renameTable(
        'user_notification_schedule',
        'v3_user_notification_schedule',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_user_notification_schedule RENAME CONSTRAINT user_notification_schedule_pkey TO v3_user_notification_schedule_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE user_notification_schedule_id_seq RENAME TO v3_user_notification_schedule_id_seq;',
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
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          datetime: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          notification_type: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
        },
        { transaction },
      );

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

      await queryInterface.addIndex('user_notification_schedule', ['survey_id'], {
        name: 'user_notification_schedule_user_id_idx',
        indexType: 'btree',
        transaction,
      });

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

      await queryInterface.sequelize.query(
        'INSERT INTO user_notification_schedule (id, user_id, survey_id, datetime, notification_type) SELECT id, user_id, survey_id, datetime, notification_type FROM v3_user_notification_schedule',
        { transaction },
      );

      await updateSequence('user_notification_schedule', 'id', { queryInterface, transaction });

      await queryInterface.changeColumn(
        'ux_events',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint('ux_events', 'user_id_fk', {
        transaction,
      });

      await queryInterface.addConstraint('ux_events', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'no action',
        name: 'ux_events_user_id_fk',
        transaction,
      });

      await queryInterface.removeConstraint('role_user', 'role_user_user_id_users_fk', {
        transaction,
      });

      await queryInterface.addConstraint('role_user', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'role_user_user_id_users_fk',
        transaction,
      });

      await queryInterface.removeConstraint('refresh_tokens', 'refresh_tokens_user_id_users_fk', {
        transaction,
      });

      await queryInterface.addConstraint('refresh_tokens', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'refresh_tokens_user_id_fk',
        transaction,
      });

      await queryInterface.removeConstraint('permission_user', 'permission_user_user_id_users_fk', {
        transaction,
      });

      await queryInterface.addConstraint('permission_user', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'permission_user_user_id_users_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'external_test_users',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint(
        'external_test_users',
        'external_test_users_user_id_fkey',
        { transaction },
      );

      await queryInterface.addConstraint('external_test_users', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'external_test_users_user_id_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'data_export_tasks',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint('data_export_tasks', 'data_export_tasks_user_id_fk', {
        transaction,
      });

      await queryInterface.addConstraint('data_export_tasks', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'data_export_tasks_user_id_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'data_export_scheduled',
        'user_id',
        { type: Sequelize.BIGINT, allowNull: false },
        { transaction },
      );

      await queryInterface.removeConstraint(
        'data_export_scheduled',
        'data_export_scheduled_user_id_fkey',
        { transaction },
      );

      await queryInterface.addConstraint('data_export_scheduled', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'data_export_scheduled_user_id_fk',
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
