/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('surveys', 'search_settings', {
        type: Sequelize.TEXT({ length: 'long' }),
        allowNull: true,
      }, { transaction });

      // Few enough survey records to do this in one go
      const surveys = await queryInterface.sequelize.query(
        `SELECT id, search_collect_data, search_sorting_algorithm, search_match_score_weight FROM surveys;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const updates = surveys.map(row => ([
        Number(row.id),
        JSON.stringify({
          collectData: Boolean(row.search_collect_data),
          sortingAlgorithm: row.search_sorting_algorithm,
          matchScoreWeight: Number(row.search_match_score_weight),
          minWordLength1: 3,
          minWordLength2: 6,
        }),
      ]));

      await queryInterface.sequelize.query(
        `with v(id, search_settings) as (values ${updates.map(() => '(?)')} )
             update surveys
             set search_settings = v.search_settings from v where surveys.id = v.id`,
        { replacements: updates, transaction },
      );

      await queryInterface.removeColumn('surveys', 'search_collect_data', { transaction });
      await queryInterface.removeColumn('surveys', 'search_sorting_algorithm', { transaction });
      await queryInterface.removeColumn('surveys', 'search_match_score_weight', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('surveys', 'search_collect_data', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      }, { transaction });

      await queryInterface.addColumn('surveys', 'search_sorting_algorithm', {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'popularity',
      }, { transaction });

      await queryInterface.addColumn('surveys', 'search_match_score_weight', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
      }, { transaction });

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, search_settings FROM surveys;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const updates = surveys.map((row) => {
        const searchSettings = JSON.parse(row.search_settings);
        return [
          Number(row.id),
          Boolean(searchSettings.collectData),
          searchSettings.sortingAlgorithm,
          Number(searchSettings.matchScoreWeight),
        ];
      });

      await queryInterface.sequelize.query(
        `with v(id, collect_data, sorting_algorithm, match_score_weight) as (values ${updates.map(() => '(?)')} )
             update surveys
             set search_collect_data = v.collect_data, search_sorting_algorithm = v.sorting_algorithm,
                 search_match_score_weight = v.match_score_weight
             from v where surveys.id = v.id`,
        { replacements: updates, transaction },
      );

      await queryInterface.removeColumn('surveys', 'search_settings', { transaction });
    });
  },
};
