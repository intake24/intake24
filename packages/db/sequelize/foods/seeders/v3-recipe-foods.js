'use strict';

const recipeFoods = [
  {
    recipe_food: { code: '$SND', name: 'Sandwich', recipe_word: 'sandwich' },
    recipe_food_steps: [
      {
        code: 'SND_1',
        name: '{ "en": "Bread and Base" }',
        description: '{ "en": "What bread did you have in your sandwich?" }',
        order: 1,
        repeatable: false,
        category_code: 'SW01',
        required: true,
      },
      {
        code: 'SND_2',
        name: '{ "en": "Spread" }',
        description: '{ "en": "What spread did you have in your sandwich?" }',
        order: 2,
        repeatable: false,
        category_code: 'SW02',
        required: false,
      },
      {
        code: 'SND_3',
        name: '{ "en": "Meat, Fish or Other Protein Source" }',
        description:
          '{ "en": "What meat, fish or other protein source did you have in your sandwich?" }',
        order: 3,
        repeatable: false,
        category_code: 'SW03',
        required: false,
      },
      {
        code: 'SND_4',
        name: '{ "en": "Cheese" }',
        description: '{ "en": "What cheese did you have in your sandwich?" }',
        order: 4,
        repeatable: false,
        category_code: 'SW04',
        required: false,
      },
      {
        code: 'SND_5',
        name: '{ "en": "Extra Filling" }',
        description: '{ "en": "What extra filling did you have in your sandwich?" }',
        order: 5,
        repeatable: true,
        category_code: 'SW05',
        required: false,
      },
      {
        code: 'SND_6',
        name: '{ "en": "Sauce and Dressing" }',
        description: '{ "en": "What sauce or dressing did you have in your sandwich?" }',
        order: 6,
        repeatable: true,
        category_code: 'SW06',
        required: false,
      },
    ],
  },
  {
    recipe_food: { code: '$SLD', name: 'Salad', recipe_word: 'salad' },
    recipe_food_steps: [
      {
        code: 'SLD_1',
        name: '{ "en": "Salad Ingridients" }',
        description: '{ "en": "What ingridients did you have in your salad?" }',
        order: 1,
        repeatable: true,
        category_code: 'SLW1',
        required: true,
      },
      {
        code: 'SLD_2',
        name: '{ "en": "Salad Dressing" }',
        description: '{ "en": "What dressing did you have in your salad?" }',
        order: 2,
        repeatable: true,
        category_code: 'SLW2',
        required: false,
      },
    ],
  },
];

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Getting all available locales from the locales table in foods DB
      const locales = await queryInterface.sequelize.query(`SELECT id FROM locales;`, {
        type: Sequelize.QueryTypes.SELECT,
      });

      const recipeFoodsEntries = [];

      for (const locale of locales) {
        // Get all the synonyms for this Recipe Food name and this locale from the Synonyms Set table in foods DB
        const synonyms = await queryInterface.sequelize.query(
          `SELECT id, locale_id, synonyms FROM synonym_sets WHERE locale_id = '${locale.id}';`,
          {
            type: Sequelize.QueryTypes.SELECT,
            transaction,
          },
        );

        recipeFoods.map((recipeFood) => {
          const synonymsIndex = synonyms.findIndex(synonym =>
            synonym.synonyms.split(/\s+/).includes(recipeFood.recipe_food.recipe_word.toLowerCase()),
          );
          console.log(
            `Synonyms Index: ${synonymsIndex} for ${recipeFood.recipe_food.recipe_word} and locale: ${locale.id}`,
          );
          return recipeFoodsEntries.push({
            ...recipeFood.recipe_food,
            locale_id: locale.id,
            synonyms_id: synonymsIndex !== -1 ? synonyms[synonymsIndex].id : null,
          });
        });
      }

      const created_at = new Date();
      const updated_at = created_at;
      const timestamps = { created_at, updated_at };

      // Creating recipe foods
      await queryInterface.bulkInsert(
        'recipe_foods',
        recipeFoodsEntries.map(recipeFoodEntry => ({ ...recipeFoodEntry, ...timestamps })),
        {
          transaction,
        },
      );

      // Getting all the recipe foods created
      const recipeFoodsCreated = await queryInterface.sequelize.query(
        `SELECT id, code, locale_id FROM recipe_foods;`,
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const recipeFoodsStepsEntries = [];
      // Creating recipe food steps
      await recipeFoodsCreated.map(async (recipeFoodCreated) => {
        const index = recipeFoods.find(
          recipeFood => recipeFood.recipe_food.code === recipeFoodCreated.code,
        );
        if (index) {
          recipeFoodsStepsEntries.push(
            ...index.recipe_food_steps.map(recipeFoodStep => ({
              ...recipeFoodStep,
              recipe_foods_id: recipeFoodCreated.id,
              locale_id: recipeFoodCreated.locale_id,
              code: `${recipeFoodCreated.locale_id}_${recipeFoodCreated.id}${recipeFoodStep.code}`,
              ...timestamps,
            })),
          );
        }
      });

      console.log(`\n\nFoodSteps to enter Example: `, recipeFoodsStepsEntries[0]);

      await queryInterface.bulkInsert('recipe_foods_steps', recipeFoodsStepsEntries, {
        transaction,
      });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const code = recipeFoods.map(recipeFood => recipeFood.recipe_food.code);
      await queryInterface.sequelize.query(`DELETE FROM recipe_foods WHERE code IN (:code);`, {
        type: queryInterface.sequelize.QueryTypes.DELETE,
        replacements: { code },
        transaction,
      });
    }),
};
