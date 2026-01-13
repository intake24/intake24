function mapper(items) {
  return items.map((item) => {
    const { localName, props, ...rest } = item;
    const { name, text, description, label, hint, ...restProps } = props;

    const i18n = { name, text, description, label, hint };

    return { ...rest, ...restProps, i18n };
  });
}

export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const { QueryTypes } = queryInterface.sequelize;

      const schemes = await queryInterface.sequelize.query(`SELECT * FROM survey_schemes;`, {
        type: QueryTypes.SELECT,
        transaction,
      });

      for (const scheme of schemes) {
        const { id } = scheme;
        const questions = JSON.parse(scheme.questions);

        if (!questions)
          continue;

        const {
          preMeals,
          meals: { preFoods, foods, postFoods },
          postMeals,
          submission,
        } = questions;

        const newQuestions = {
          preMeals: mapper(preMeals),
          meals: { preFoods: mapper(preFoods), foods: mapper(foods), postFoods: mapper(postFoods) },
          postMeals: mapper(postMeals),
          submission: mapper(submission),
        };

        await queryInterface.sequelize.query(
          `UPDATE survey_schemes SET questions = :questions WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, questions: JSON.stringify(newQuestions) },
            transaction,
          },
        );
      }
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
