export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'survey-schemes|prompts', display_name = 'Survey scheme prompts' WHERE name = 'survey-schemes|questions';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = replace(name, 'survey-scheme-questions', 'survey-scheme-prompts'), display_name = replace(display_name, 'questions', 'prompts') WHERE "name" ilike 'survey-scheme-questions%';`,
        { transaction },
      );

      await queryInterface.renameColumn('survey_schemes', 'questions', 'prompts', { transaction });

      await queryInterface.renameTable('survey_scheme_questions', 'survey_scheme_prompts', {
        transaction,
      });
      await queryInterface.renameColumn('survey_scheme_prompts', 'question_id', 'prompt_id', {
        transaction,
      });
      await queryInterface.renameColumn('survey_scheme_prompts', 'question', 'prompt', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE survey_scheme_prompts RENAME CONSTRAINT scheme_questions_pkey TO scheme_prompts_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE survey_scheme_prompts RENAME CONSTRAINT scheme_questions_question_id_key TO scheme_prompts_prompt_id_key;`,
        { transaction },
      );

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, survey_scheme_overrides FROM surveys;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      for (const survey of surveys) {
        const { id, survey_scheme_overrides } = survey;

        const { meals, questions: prompts } = JSON.parse(survey_scheme_overrides);

        await queryInterface.sequelize.query(
          `UPDATE surveys SET survey_scheme_overrides = :survey_scheme_overrides WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, survey_scheme_overrides: JSON.stringify({ meals, prompts }) },
            transaction,
          },
        );
      }
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'survey-schemes|questions', display_name = 'Survey scheme questions' WHERE name = 'survey-schemes|prompts';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = replace(name, 'survey-scheme-prompts', 'survey-scheme-questions'), display_name = replace(display_name, 'prompts', 'questions') WHERE "name" ilike 'survey-scheme-prompts%';`,
        { transaction },
      );

      await queryInterface.renameColumn('survey_schemes', 'prompts', 'questions', { transaction });

      await queryInterface.sequelize.query(
        `ALTER TABLE survey_scheme_prompts RENAME CONSTRAINT scheme_prompts_prompt_id_key TO scheme_questions_question_id_key;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE survey_scheme_prompts RENAME CONSTRAINT scheme_prompts_pkey TO scheme_questions_pkey;`,
        { transaction },
      );

      await queryInterface.renameColumn('survey_scheme_prompts', 'prompt', 'question', {
        transaction,
      });

      await queryInterface.renameColumn('survey_scheme_prompts', 'prompt_id', 'question_id', {
        transaction,
      });

      await queryInterface.renameTable('survey_scheme_prompts', 'survey_scheme_questions', {
        transaction,
      });

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, survey_scheme_overrides FROM surveys;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      for (const survey of surveys) {
        const { id, survey_scheme_overrides } = survey;

        const { meals, prompts: questions } = JSON.parse(survey_scheme_overrides);

        await queryInterface.sequelize.query(
          `UPDATE surveys SET survey_scheme_overrides = :survey_scheme_overrides WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, survey_scheme_overrides: JSON.stringify({ meals, questions }) },
            transaction,
          },
        );
      }
    }),
};
