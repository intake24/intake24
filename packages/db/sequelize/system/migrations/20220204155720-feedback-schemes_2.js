import { nanoid } from 'nanoid';

import foodDbConfig from '../../foods/config.js';
import { createPermissions } from '../../utils.js';

const permissions = [
  {
    name: 'feedback-schemes|demographic-groups',
    display_name: 'Feedback scheme demographic groups',
  },
  {
    name: 'feedback-schemes|henry-coefficients',
    display_name: 'Feedback scheme henry coefficients',
  },
];

const henryCoefficients = [
  {
    sex: 'm',
    age: { start: 0, end: 3 },
    weightCoefficient: 28.2,
    heightCoefficient: 859,
    constant: -371,
  },
  {
    sex: 'm',
    age: { start: 3, end: 10 },
    weightCoefficient: 15.1,
    heightCoefficient: 313,
    constant: 306,
  },
  {
    sex: 'm',
    age: { start: 10, end: 18 },
    weightCoefficient: 15.6,
    heightCoefficient: 266,
    constant: 299,
  },
  {
    sex: 'm',
    age: { start: 18, end: 30 },
    weightCoefficient: 14.4,
    heightCoefficient: 313,
    constant: 113,
  },
  {
    sex: 'm',
    age: { start: 30, end: 60 },
    weightCoefficient: 11.4,
    heightCoefficient: 541,
    constant: -137,
  },
  {
    sex: 'm',
    age: { start: 60, end: Number.MAX_VALUE },
    weightCoefficient: 11.4,
    heightCoefficient: 541,
    constant: -256,
  },
  {
    sex: 'f',
    age: { start: 0, end: 3 },
    weightCoefficient: 30.4,
    heightCoefficient: 703,
    constant: -287,
  },
  {
    sex: 'f',
    age: { start: 3, end: 10 },
    weightCoefficient: 15.9,
    heightCoefficient: 210,
    constant: 349,
  },
  {
    sex: 'f',
    age: { start: 10, end: 18 },
    weightCoefficient: 9.4,
    heightCoefficient: 249,
    constant: 462,
  },
  {
    sex: 'f',
    age: { start: 18, end: 30 },
    weightCoefficient: 10.4,
    heightCoefficient: 615,
    constant: -282,
  },
  {
    sex: 'f',
    age: { start: 30, end: 60 },
    weightCoefficient: 8.18,
    heightCoefficient: 502,
    constant: -11.6,
  },
  {
    sex: 'f',
    age: { start: 60, end: Number.MAX_VALUE },
    weightCoefficient: 8.52,
    heightCoefficient: 421,
    constant: 10.7,
  },
];

const characters = [
  {
    type: 'character',
    characterType: 'battery',
    nutrientTypeIds: ['1'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Your battery needs a boost',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Your battery needs a boost',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Your\'re so energetic',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Energy overload',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Energy overload',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'bread',
    nutrientTypeIds: ['13'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'You could be more starchy',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'You could be more starchy',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'You\'re Super Starchy!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Careful on the starch',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Careful on the starch',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'apple',
    nutrientTypeIds: ['15'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Keep your finger on pulses!',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Keep your finger on pulses!',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Fibre-licious!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Keep your finger on pulses!',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Keep your finger on pulses!',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'candy',
    nutrientTypeIds: ['23'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Take care, Sugar',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Take care, Sugar',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'You\'re doing well, Sugar',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Take care, Sugar',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Take care, Sugar',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'salmon',
    nutrientTypeIds: ['120'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Not quite scoring A* for Vitamin A',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Not quite scoring A* for Vitamin A',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Scoring A* for Vitamin A',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Too fishy',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'milk',
    nutrientTypeIds: ['140'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Your milk could be spoiled',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Your milk could be spoiled',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Say cheese!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Your milk could be spoiled',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Your milk could be spoiled',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'burger',
    nutrientTypeIds: ['50'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Please don\'t eat me!',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Please don\'t eat me!',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Such a rate!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Please don\'t eat me!',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Please don\'t eat me!',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'fries',
    nutrientTypeIds: ['49'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Chip is feeling fried',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Chip is feeling fried',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Chip is feeling delicious!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Chip is feeling fried',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Chip is feeling fried',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'egg',
    nutrientTypeIds: ['11'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Pump up that protein!',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Pump up that protein!',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Feels Egg-static!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Whey too much protein!',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Whey too much protein!',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'strawberry',
    nutrientTypeIds: ['129'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: 'Stranded in the Vitamin Sea',
      },
      {
        sentiment: ['bit_low'],
        sentimentType: 'warning',
        title: 'Stranded in the Vitamin Sea',
      },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: 'Sí Señor(ita)!',
      },
      {
        sentiment: ['bit_high'],
        sentimentType: 'warning',
        title: 'Too deep in the Vitamin Sea',
      },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: 'Too deep in the Vitamin Sea',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'iron',
    nutrientTypeIds: ['143'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: '',
      },
      { sentiment: ['bit_low'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: '',
      },
      { sentiment: ['bit_high'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: '',
      },
    ],
    displayInFeedbackStyle: 'default',
  },

  {
    type: 'character',
    characterType: 'folate',
    nutrientTypeIds: ['134'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: '',
      },
      { sentiment: ['bit_low'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: '',
      },
      { sentiment: ['bit_high'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: '',
      },
    ],
    displayInFeedbackStyle: 'default',
  },

  {
    type: 'character',
    characterType: 'candy',
    nutrientTypeIds: ['251'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: '',
      },
      { sentiment: ['bit_low'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: '',
      },
      { sentiment: ['bit_high'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: '',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'apple',
    nutrientTypeIds: ['242'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: '',
      },
      { sentiment: ['bit_low'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: '',
      },
      { sentiment: ['bit_high'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: '',
      },
    ],
  },

  {
    type: 'character',
    characterType: 'co2',
    nutrientTypeIds: ['228'],
    sentiments: [
      {
        sentiment: ['too_low', 'low'],
        sentimentType: 'danger',
        title: '',
      },
      { sentiment: ['bit_low'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['good', 'excellent'],
        sentimentType: 'exciting',
        title: '',
      },
      { sentiment: ['bit_high'], sentimentType: 'warning', title: '' },
      {
        sentiment: ['high', 'too_high'],
        sentimentType: 'danger',
        title: '',
      },
    ],
  },
];

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('feedback_schemes', 'food_groups', 'cards', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = 'feedback-schemes|cards', display_name = 'Feedback scheme cards' where "name" = 'feedback-schemes|food-groups';`,
        { transaction },
      );

      await queryInterface.addColumn(
        'feedback_schemes',
        'demographic_groups',
        { allowNull: true, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      const { QueryTypes } = queryInterface.sequelize;

      const env = process.env.NODE_ENV;
      const { url, ...config } = foodDbConfig[env];
      const foods = url ? new Sequelize(url, foodDbConfig[env]) : new Sequelize(config);

      const dgExists = await queryInterface.tableExists('demographic_groups');
      const dgTable = dgExists ? 'demographic_groups' : 'demographic_group';

      const dgssExists = await queryInterface.tableExists('demographic_group_scale_sectors', {});
      const dgssTable = dgssExists ? 'demographic_groups' : 'demographic_group';

      const dbDemographicGroups = await foods.query(`SELECT * FROM ${dgTable} ORDER BY id;`, {
        type: QueryTypes.SELECT,
      });

      const dbDemographicGroupScaleSectors = await foods.query(`SELECT * FROM ${dgssTable};`, {
        type: QueryTypes.SELECT,
      });

      const dbFoodGroupsFeedbacks = await foods.query(
        `SELECT * FROM food_groups_feedback ORDER BY id;`,
        { type: QueryTypes.SELECT },
      );

      const dbFoodGroupsFeedbackNutrientIds = await foods.query(
        `SELECT * FROM food_groups_feedback_nutrient_ids;`,
        { type: QueryTypes.SELECT },
      );

      const dbFiveADayFeedbacks = await foods.query(`SELECT * FROM five_a_day_feedback;`, {
        type: QueryTypes.SELECT,
      });

      await foods.close();

      const demographicGroups = [];
      const cards = characters.map((character) => {
        const { sentiments, ...rest } = character;

        return {
          id: nanoid(6),
          ...rest,
          sentiments: sentiments.map(({ title, ...restSentiment }) => ({
            ...restSentiment,
            name: { en: title || null },
          })),
          showRecommendations: false,
        };
      });

      const formatRange = (start, end) => {
        if (start === null && end === null)
          return null;

        return { start: start || 0, end: end || 0 };
      };

      const formatSectorName = (name) => {
        if (!name)
          return '';

        const sectorName = name
          .replace(/your/gi, '')
          .replace(/intake is/gi, '')
          .trim()
          .toLowerCase();

        return `${sectorName.charAt(0).toUpperCase()}${sectorName.slice(1)}`;
      };

      for (const dbDemographicGroup of dbDemographicGroups) {
        const {
          id,
          min_age,
          max_age,
          min_height,
          max_height,
          min_weight,
          max_weight,
          sex,
          physical_activity_level_id,
          nutrient_type_id,
          nutrient_rule_type,
        } = dbDemographicGroup;

        const scaleSectors = dbDemographicGroupScaleSectors
          .filter(dgScaleSector => dgScaleSector.demographic_group_id === id)
          .map(({ name, description, sentiment, min_range, max_range }) => ({
            name: { en: formatSectorName(name) },
            description: { en: description || null },
            range: formatRange(min_range, max_range),
            sentiment,
          }));

        demographicGroups.push({
          id: nanoid(6),
          type: 'demographic-group',
          age: formatRange(min_age, max_age),
          height: formatRange(min_height, max_height),
          weight: formatRange(min_weight, max_weight),
          nutrientRuleType: nutrient_rule_type,
          nutrientTypeId: nutrient_type_id,
          physicalActivityLevelId: physical_activity_level_id,
          sex,
          scaleSectors,
        });
      }

      for (const dbFoodGroupsFeedback of dbFoodGroupsFeedbacks) {
        const {
          id,
          name,
          too_high_threshold,
          too_high_message,
          too_low_threshold,
          too_low_message,
          tell_me_more_text,
        } = dbFoodGroupsFeedback;

        const nutrientTypes = dbFoodGroupsFeedbackNutrientIds
          .filter(nutrientId => nutrientId.food_groups_feedback_id === id)
          .map(nutrientId => nutrientId.nutrient_id.toString());

        cards.push({
          id: nanoid(6),
          type: 'nutrient-group',
          name: { en: name || '' },
          description: { en: tell_me_more_text || null },
          high:
            too_high_threshold === null
              ? null
              : { threshold: too_high_threshold, message: { en: too_high_message || null } },
          low:
            too_low_threshold === null
              ? null
              : { threshold: too_low_threshold, message: { en: too_low_message || null } },
          unit:
            name === 'red and processed meat'
              ? { name: { en: 'g' }, description: { en: null } }
              : { name: { en: '' }, description: { en: null } },
          nutrientTypes,
          showRecommendations: false,
        });
      }

      for (const dbFiveADayFeedback of dbFiveADayFeedbacks) {
        const { tell_me_more_text, too_low_message } = dbFiveADayFeedback;

        cards.push({
          id: nanoid(6),
          type: 'five-a-day',
          name: { en: 'Fruit and vegetable intake' },
          description: { en: tell_me_more_text || null },
          high: { threshold: 5, message: { en: null } },
          low: { threshold: 5, message: { en: too_low_message || null } },
          unit: {
            name: { en: 'portions' },
            description: {
              en: 'Number of portions is calculated based on your fruit and vegetable intake as explained below.',
            },
          },
          showRecommendations: false,
        });
      }

      const feedbackSchemes = await queryInterface.sequelize.query(
        `SELECT * FROM feedback_schemes WHERE type = :types;`,
        { type: QueryTypes.SELECT, replacements: { types: 'default' }, transaction },
      );

      for (const feedbackScheme of feedbackSchemes) {
        await queryInterface.sequelize.query(
          `UPDATE feedback_schemes SET cards = :cards, demographic_groups = :demographicGroups, henry_coefficients = :henryCoefficients WHERE id = :id;`,
          {
            type: QueryTypes.UPDATE,
            replacements: {
              id: feedbackScheme.id,
              cards: JSON.stringify(cards),
              demographicGroups: JSON.stringify(demographicGroups),
              henryCoefficients: JSON.stringify(
                henryCoefficients.map(coefficient => ({ ...coefficient, id: nanoid(6) })),
              ),
            },
            transaction,
          },
        );
      }

      await queryInterface.changeColumn(
        'feedback_schemes',
        'demographic_groups',
        { allowNull: false, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      await queryInterface.changeColumn(
        'feedback_schemes',
        'henry_coefficients',
        { allowNull: false, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('feedback_schemes', 'demographic_groups', { transaction });

      await queryInterface.renameColumn('feedback_schemes', 'cards', 'food_groups', {
        transaction,
      });

      await queryInterface.changeColumn(
        'feedback_schemes',
        'henry_coefficients',
        { allowNull: true, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = 'feedback-schemes|food-groups', display_name = 'Feedback scheme food groups' where "name" = 'feedback-schemes|cards';`,
        { transaction },
      );

      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });
    }),
};
