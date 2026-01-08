'use strict';

const { merge } = require('lodash-es');

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

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const surveys = await queryInterface.sequelize.query(
        `SELECT id, search_settings FROM surveys;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const updates = surveys.map(row => ([
        Number(row.id),
        JSON.stringify(merge(defaultSearchSettings, JSON.parse(row.search_settings))),
      ]));

      await queryInterface.sequelize.query(
        `with v(id, search_settings) as (values ${updates.map(() => '(?)')} )
             update surveys
             set search_settings = v.search_settings from v where surveys.id = v.id`,
        { replacements: updates, transaction },
      );
    });
  },

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
