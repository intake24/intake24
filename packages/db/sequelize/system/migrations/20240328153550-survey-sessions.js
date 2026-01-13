import { createPermissions } from '../../utils.js';

const permissions = [{ name: 'surveys|sessions', display_name: 'Survey sessions' }];

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await createPermissions(permissions, { queryInterface, transaction });

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, submission_notification_url FROM surveys;`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const survey of surveys) {
        const { id, submission_notification_url } = survey;

        const notifications = [];

        if (submission_notification_url) {
          notifications.push({
            type: 'survey.session.submitted',
            channel: 'webhook',
            url: submission_notification_url,
          });
        }

        await queryInterface.sequelize.query(
          `UPDATE surveys SET submission_notification_url = :notifications WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, notifications: JSON.stringify(notifications) },
            transaction,
          },
        );
      }

      await queryInterface.renameColumn('surveys', 'submission_notification_url', 'notifications', {
        transaction,
      });

      await queryInterface.changeColumn(
        'surveys',
        'notifications',
        {
          type: Sequelize.TEXT({ length: 'long' }),
          allowNull: false,
          defaultValue: '[]',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'surveys',
        'session_lifetime',
        {
          allowNull: false,
          type: Sequelize.STRING(32),
          defaultValue: '12h',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'surveys',
        'search_collect_data',
        {
          allowNull: false,
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.renameColumn('survey_submissions', 'ux_session_id', 'session_id', {
        transaction,
      });

      await queryInterface.addIndex('survey_submissions', ['session_id'], {
        name: 'survey_submissions_session_id_idx',
        indexType: 'btree',
        transaction,
      });

      // user_survey_sessions
      await queryInterface.renameTable('user_survey_sessions', 'old_user_survey_sessions', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE old_user_survey_sessions RENAME CONSTRAINT user_survey_sessions_pkey TO old_user_survey_sessions_pkey;`,
        { transaction },
      );

      await queryInterface.createTable(
        'user_survey_sessions',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          survey_id: {
            allowNull: false,
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
        {
          transaction,
          uniqueKeys: {
            user_survey_sessions_unique: { fields: ['survey_id', 'user_id'] },
          },
        },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO user_survey_sessions (id, user_id, survey_id, session_data, created_at, updated_at) SELECT (session_data::json->>'uxSessionId')::uuid, old.user_id, old.survey_id, old.session_data, old.created_at, old.updated_at FROM old_user_survey_sessions old;`,
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

      await queryInterface.dropTable('old_user_survey_sessions', { transaction });
    }),

  down: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });

      await queryInterface.changeColumn(
        'surveys',
        'notifications',
        {
          type: Sequelize.STRING(2048),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.renameColumn('surveys', 'notifications', 'submission_notification_url', {
        transaction,
      });

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, submission_notification_url FROM surveys;`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const survey of surveys) {
        const { id } = survey;

        const notifications = JSON.parse(survey.submission_notification_url);
        const url = notifications.length ? notifications[0].url : null;

        await queryInterface.sequelize.query(
          `UPDATE surveys SET submission_notification_url = :url WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, url },
            transaction,
          },
        );
      }

      await queryInterface.removeColumn('surveys', 'session_lifetime', { transaction });
      await queryInterface.removeColumn('surveys', 'search_collect_data', { transaction });

      await queryInterface.removeIndex('survey_submissions', 'survey_submissions_session_id_idx', {
        transaction,
      });

      await queryInterface.renameColumn('survey_submissions', 'session_id', 'ux_session_id', {
        transaction,
      });
    }),
};
