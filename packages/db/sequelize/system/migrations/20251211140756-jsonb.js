/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE client_error_reports ALTER COLUMN survey_state_json TYPE jsonb USING survey_state_json::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE faqs ALTER COLUMN content TYPE jsonb USING content::jsonb;`,
        { transaction },
      );

      await Promise.all(
        ['outputs', 'physical_data_fields'].map(column =>
          queryInterface.sequelize.query(
            `UPDATE feedback_schemes SET ${column} = :def WHERE ${column} IS NULL;`,
            {
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              replacements: { def: JSON.stringify([]) },
              transaction,
            },
          ),
        ),
      );

      await Promise.all(
        ['outputs', 'physical_data_fields'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE feedback_schemes ALTER COLUMN ${column} SET NOT NULL;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        [
          'top_foods',
          'cards',
          'henry_coefficients',
          'demographic_groups',
          'outputs',
          'physical_data_fields',
          'sections',
          'meals',
        ].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE feedback_schemes ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        [
          'cards',
          'henry_coefficients',
          'demographic_groups',
          'outputs',
          'physical_data_fields',
          'sections',
        ].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE feedback_schemes ALTER COLUMN ${column} SET DEFAULT '[]'::jsonb;`,
            { transaction },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `UPDATE jobs SET params = :def WHERE params IS NULL;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { def: JSON.stringify({}) },
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE jobs ALTER COLUMN params SET NOT NULL;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE jobs ALTER COLUMN params TYPE jsonb USING params::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE language_translations ALTER COLUMN messages TYPE jsonb USING messages::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE mfa_authenticators ALTER COLUMN transports TYPE jsonb USING transports::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE personal_access_tokens ALTER COLUMN scopes TYPE jsonb USING scopes::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE survey_scheme_prompts ALTER COLUMN prompt TYPE jsonb USING prompt::jsonb;`,
        { transaction },
      );

      await Promise.all(
        ['meals', 'data_export'].map(column =>
          queryInterface.sequelize.query(
            `UPDATE survey_schemes SET ${column} = :def WHERE ${column} IS NULL;`,
            {
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              replacements: { def: JSON.stringify([]) },
              transaction,
            },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_schemes SET prompts = :def WHERE prompts IS NULL;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { def: JSON.stringify({}) },
          transaction,
        },
      );

      await Promise.all(
        ['prompts', 'meals', 'data_export'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE survey_schemes ALTER COLUMN ${column} SET NOT NULL;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['settings', 'prompts', 'meals', 'data_export'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE survey_schemes ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['meals', 'data_export'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE survey_schemes ALTER COLUMN ${column} SET DEFAULT '[]'::jsonb;`,
            { transaction },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE survey_submission_external_sources ALTER COLUMN data TYPE jsonb USING data::jsonb;`,
        { transaction },
      );

      const defaultOverrides = {
        meals: [],
        prompts: [],
        settings: {},
      };

      await queryInterface.sequelize.query(
        `UPDATE surveys SET survey_scheme_overrides = :defaultOverrides WHERE survey_scheme_overrides IS NULL;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { defaultOverrides: JSON.stringify(defaultOverrides) },
          transaction,
        },
      );

      const defaultSearchSettings = {
        collectData: true,
        maxResults: 100,
        matchScoreWeight: 20,
        sortingAlgorithm: 'popularity',
        spellingCorrectionPreference: 'phonetic',
        minWordLength1: 3,
        minWordLength2: 6,
        enableEditDistance: true,
        enablePhonetic: true,
        minWordLengthPhonetic: 3,
        firstWordCost: 0,
        wordOrderCost: 4,
        wordDistanceCost: 1,
        unmatchedWordCost: 8,
        enableRelevantCategories: false,
        relevantCategoryDepth: 0,
      };

      await queryInterface.sequelize.query(
        `UPDATE surveys SET search_settings = :defaultSearchSettings WHERE search_settings IS NULL;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { defaultSearchSettings: JSON.stringify(defaultSearchSettings) },
          transaction,
        },
      );

      const defaultSessionSettings = {
        store: true,
        age: '12h',
        fixed: '1d+0h',
      };

      await queryInterface.sequelize.query(
        `UPDATE surveys SET session = :defaultSessionSettings WHERE session IS NULL;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { defaultSessionSettings: JSON.stringify(defaultSessionSettings) },
          transaction,
        },
      );

      await Promise.all(
        ['survey_scheme_overrides', 'search_settings', 'session'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE surveys ALTER COLUMN ${column} SET NOT NULL;`,
            { transaction },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE surveys ALTER COLUMN notifications DROP DEFAULT;`,
        { transaction },
      );

      await Promise.all(
        [
          'notifications',
          'survey_scheme_overrides',
          'search_settings',
          'session',
        ].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE surveys ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE surveys ALTER COLUMN notifications SET DEFAULT '[]'::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE tasks SET params = :def WHERE params IS NULL;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { def: JSON.stringify({}) },
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE tasks ALTER COLUMN params SET NOT NULL;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE tasks ALTER COLUMN params TYPE jsonb USING params::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE user_securables ALTER COLUMN fields TYPE jsonb USING fields::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE user_subscriptions ALTER COLUMN subscription TYPE jsonb USING subscription::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE user_survey_sessions ALTER COLUMN session_data TYPE jsonb USING session_data::jsonb;`,
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('client_error_reports', 'survey_state_json', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('faqs', 'content', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await Promise.all(
        [
          'top_foods',
          'cards',
          'henry_coefficients',
          'demographic_groups',
          'outputs',
          'physical_data_fields',
          'sections',
          'meals',
        ].map(column =>
          queryInterface.changeColumn('feedback_schemes', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await queryInterface.changeColumn('jobs', 'params', {
        allowNull: true,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('language_translations', 'messages', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('mfa_authenticators', 'transports', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('personal_access_tokens', 'scopes', {
        allowNull: true,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('survey_scheme_prompts', 'prompt', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await Promise.all(
        [
          'settings',
          'prompts',
          'meals',
          'data_export',
        ].map(column =>
          queryInterface.changeColumn('survey_schemes', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await queryInterface.changeColumn('survey_submission_external_sources', 'data', {
        allowNull: true,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await Promise.all(
        [
          'survey_scheme_overrides',
          'search_settings',
          'session',
        ].map(column =>
          queryInterface.changeColumn('surveys', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await queryInterface.changeColumn('surveys', 'notifications', {
        allowNull: false,
        defaultValue: '[]',
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('tasks', 'params', {
        allowNull: true,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('user_securables', 'fields', {
        allowNull: true,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('user_subscriptions', 'subscription', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await queryInterface.changeColumn('user_survey_sessions', 'session_data', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });
    }),
};
