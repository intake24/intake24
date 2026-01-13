export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const { QueryTypes } = queryInterface.sequelize;

      const surveys = await queryInterface.sequelize.query(`SELECT * FROM surveys;`, {
        type: QueryTypes.SELECT,
        transaction,
      });

      for (const survey of surveys) {
        const { id, description, final_page_html, overrides } = survey;

        const surveySchemeOverrides = { meals: [], questions: [], ...JSON.parse(overrides) };

        if (description) {
          surveySchemeOverrides.questions.push({
            component: 'info-prompt',
            type: 'custom',
            id: 'welcome-prompt',
            name: 'Welcome prompt',
            props: {
              name: { en: 'Welcome' },
              text: { en: 'Thank you for taking part in this study' },
              description: { en: description },
              conditions: [],
            },
          });
        }

        if (final_page_html) {
          surveySchemeOverrides.questions.push({
            component: 'info-prompt',
            type: 'custom',
            id: 'final-prompt',
            name: 'Final prompt',
            props: {
              name: { en: 'Final' },
              text: {
                en: 'Your food intake information has been recorded. Thank you for your participation!',
              },
              description: { en: final_page_html },
              conditions: [],
            },
          });
        }

        await queryInterface.sequelize.query(
          `UPDATE surveys SET overrides = :overrides WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, overrides: JSON.stringify(surveySchemeOverrides) },
            transaction,
          },
        );
      }
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
