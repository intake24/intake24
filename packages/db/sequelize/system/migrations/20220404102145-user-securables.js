import { createPermissions } from '../../utils.js';

const permissions = [
  { name: 'feedback-schemes|copy', display_name: 'Copy feedback schemes' },
  { name: 'feedback-schemes|securables', display_name: 'Feedback schemes security' },
  { name: 'survey-schemes|copy', display_name: 'Copy survey schemes' },
  { name: 'survey-schemes|securables', display_name: 'Survey schemes security' },

  { name: 'users', display_name: 'Users resource access' },
  { name: 'roles', display_name: 'Roles resource access' },
  { name: 'permissions', display_name: 'Permissions resource access' },
  { name: 'as-served', display_name: 'As served sets resource access' },
  { name: 'fdbs', display_name: 'Food databases resource access' },
  { name: 'feedback-schemes', display_name: 'Feedback schemes resource access' },
  { name: 'food-groups', display_name: 'Food groups resource access' },
  { name: 'guide-images', display_name: 'Guide images resource access' },
  { name: 'image-maps', display_name: 'Image maps resource access' },
  { name: 'jobs', display_name: 'Jobs resource access' },
  { name: 'languages', display_name: 'Languages resource access' },
  { name: 'locales', display_name: 'Locales resource access' },
  { name: 'nutrient-tables', display_name: 'Nutrient tables resource access' },
  { name: 'sign-in-logs', display_name: 'Sign-in logs resource access' },
  { name: 'survey-schemes', display_name: 'Survey schemes resource access' },
  { name: 'survey-scheme-questions', display_name: 'Survey scheme questions resource access' },
  { name: 'surveys', display_name: 'Surveys resource access' },
  { name: 'tasks', display_name: 'Tasks resource access' },
];

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'user_securables',
        {
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true,
          },
          securable_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true,
          },
          securable_type: {
            type: Sequelize.STRING(64),
            allowNull: false,
            primaryKey: true,
          },
          action: {
            type: Sequelize.STRING(64),
            allowNull: false,
            primaryKey: true,
          },
          fields: {
            type: Sequelize.TEXT,
            allowNull: true,
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

      await queryInterface.addIndex(
        'user_securables',
        ['user_id', 'securable_id', 'securable_type', 'action'],
        {
          name: 'user_securables_search_idx',
          indexType: 'btree',
          transaction,
        },
      );

      await queryInterface.addConstraint('user_securables', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'user_securables_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('user_securables', ['user_id'], {
        name: 'user_securables_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addColumn(
        'feedback_schemes',
        'owner_id',
        { type: Sequelize.BIGINT, allowNull: true },
        { transaction },
      );

      await queryInterface.addConstraint('feedback_schemes', {
        fields: ['owner_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'feedback_schemes_owner_id_fk',
        transaction,
      });

      await queryInterface.addIndex('feedback_schemes', ['owner_id'], {
        name: 'feedback_schemes_owner_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addColumn(
        'survey_schemes',
        'owner_id',
        { type: Sequelize.BIGINT, allowNull: true },
        { transaction },
      );

      await queryInterface.addConstraint('survey_schemes', {
        fields: ['owner_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'survey_schemes_owner_id_fk',
        transaction,
      });

      await queryInterface.addIndex('survey_schemes', ['owner_id'], {
        name: 'survey_schemes_owner_id_idx',
        indexType: 'btree',
        transaction,
      });

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('feedback_schemes', 'owner_id', { transaction });
      await queryInterface.removeColumn('survey_schemes', 'owner_id', { transaction });

      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });

      await queryInterface.dropTable('user_securables', { transaction });
    }),
};
