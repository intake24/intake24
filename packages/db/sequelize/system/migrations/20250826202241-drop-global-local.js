/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all([
        queryInterface.changeColumn('fixed_food_ranking', 'food_code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('fixed_food_ranking', 'locale_id', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('locales', 'code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('pairwise_associations_co_occurrences', 'antecedent_food_code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('pairwise_associations_co_occurrences', 'consequent_food_code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('pairwise_associations_occurrences', 'food_code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('popularity_counters', 'food_code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.changeColumn('survey_submission_foods', 'code', { allowNull: false, type: Sequelize.STRING(64) }, { transaction }),
        queryInterface.removeColumn('locales', 'prototype_locale_id', { transaction }),
      ]);

      await queryInterface.addColumn(
        'survey_submission_foods',
        'locale',
        {
          allowNull: true,
          type: Sequelize.STRING(64),
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods ssf
          SET locale = l.code
          FROM survey_submission_meals ssm
          JOIN survey_submissions ss ON ss.id = ssm.survey_submission_id
          JOIN surveys s ON s.id = ss.survey_id
          JOIN locales l ON l.id = s.locale_id
          WHERE ssf.meal_id = ssm.id`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'survey_submission_foods',
        'locale',
        {
          allowNull: false,
          type: Sequelize.STRING(64),
        },
        { transaction },
      );
    });
  },

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
