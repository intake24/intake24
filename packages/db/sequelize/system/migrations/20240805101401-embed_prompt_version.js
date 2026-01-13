function addVersionToPrompt(prompt, version) {
  return {
    ...prompt,
    version,
  };
}

function addVersionToSchemePrompts(prompts, version) {
  return {
    preMeals: prompts.preMeals.map(prompt => addVersionToPrompt(prompt, version)),
    meals: {
      preFoods: prompts.meals.preFoods.map(prompt => addVersionToPrompt(prompt, version)),
      foods: prompts.meals.foods.map(prompt => addVersionToPrompt(prompt, version)),
      postFoods: prompts.meals.postFoods.map(prompt => addVersionToPrompt(prompt, version)),
    },
    postMeals: prompts.postMeals.map(prompt => addVersionToPrompt(prompt, version)),
    submission: prompts.submission.map(prompt => addVersionToPrompt(prompt, version)),
  };
}

function addVersionToSchemeOverridePrompts(schemeOverride, version) {
  return {
    ...schemeOverride,
    prompts: schemeOverride.prompts.map(prompt => addVersionToPrompt(prompt, version)),
  };
}

export default {
  async up(queryInterface, QueryTypes) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const schemeRows = await queryInterface.sequelize.query('select id, prompts, version from survey_schemes', {
        type: QueryTypes.SELECT,
        transaction,
      });

      const schemeUpdates = schemeRows.map(row => ([
        Number(row.id),
        JSON.stringify(addVersionToSchemePrompts(JSON.parse(row.prompts), row.version)),
      ]));

      await queryInterface.sequelize.query(
        `with v(id, prompts) as (values ${schemeUpdates.map(() => '(?)')} )
             update survey_schemes
             set prompts = v.prompts from v where survey_schemes.id = v.id`,
        { replacements: schemeUpdates, transaction },
      );

      const surveyRows = await queryInterface.sequelize.query('select id, survey_scheme_overrides from surveys', {
        type: QueryTypes.SELECT,
        transaction,
      });

      const surveyUpdates = surveyRows.map(row => ([
        Number(row.id),
        JSON.stringify(addVersionToSchemeOverridePrompts(JSON.parse(row.survey_scheme_overrides), 1)),
      ]));

      await queryInterface.sequelize.query(
        `with v(id, survey_scheme_overrides) as (values ${schemeUpdates.map(() => '(?)')} )
             update surveys
             set survey_scheme_overrides = v.survey_scheme_overrides from v where surveys.id = v.id`,
        { replacements: surveyUpdates, transaction },
      );

      await queryInterface.removeColumn('survey_schemes', 'version', { transaction });
    });
  },

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
