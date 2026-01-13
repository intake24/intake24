import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('client_error_reports', 'v3_client_error_reports', {
        transaction,
      });

      await queryInterface.createTable(
        'client_error_reports',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.STRING(256),
            allowNull: true,
          },
          survey_id: {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          reported_at: {
            type: Sequelize.DATE,
            allowNull: false,
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
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO client_error_reports (id, user_id, survey_id, reported_at, stack_trace, survey_state_json, "new") SELECT id, user_id, survey_id, reported_at, array_to_string(stack_trace, E'\n'), survey_state_json, "new" FROM v3_client_error_reports`,
        { transaction },
      );

      await updateSequence('client_error_reports', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('jobs', 'v3_jobs', {
        transaction,
      });

      await queryInterface.createTable(
        'jobs',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          type: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          download_url: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          download_url_expires_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          progress: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },
          successful: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          message: {
            type: Sequelize.STRING(1024),
            allowNull: true,
          },
          stack_trace: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: true,
          },
          started_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
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

      await queryInterface.addConstraint('jobs', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'jobs_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('jobs', ['user_id'], {
        name: 'jobs_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO jobs (id, type, user_id, download_url, download_url_expires_at, progress, successful, message, stack_trace, started_at, completed_at, created_at, updated_at) SELECT id, type, user_id, download_url, download_url_expires_at, progress, successful, message, stack_trace, started_at, completed_at, created_at, updated_at FROM v3_jobs',
        { transaction },
      );

      await updateSequence('jobs', 'id', { queryInterface, transaction });

      await queryInterface.sequelize.query(
        `DELETE FROM signin_log WHERE user_id not in (SELECT id FROM users);`,
        { transaction },
      );

      await queryInterface.renameTable('signin_log', 'v3_signin_log', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_signin_log RENAME CONSTRAINT signin_log_pkey TO v3_signin_log_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE signin_log_id_seq RENAME TO v3_signin_log_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'signin_log',
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
          date: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          remote_address: {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          provider: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          provider_key: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          successful: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          user_agent: {
            type: Sequelize.STRING(512),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('signin_log', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'signin_log_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('signin_log', ['user_id'], {
        name: 'signin_log_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO signin_log (id, user_id, date, remote_address, provider, provider_key, successful, message, user_agent) SELECT id, user_id, date, remote_address, provider, provider_key, successful, message, user_agent FROM v3_signin_log',
        { transaction },
      );

      await updateSequence('signin_log', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
