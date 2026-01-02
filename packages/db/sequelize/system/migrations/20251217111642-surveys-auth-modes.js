/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'auth_modes',
        {
          allowNull: false,
          defaultValue: ['token'],
          type: Sequelize.JSONB,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE surveys SET auth_modes = '["token", "username"]'::jsonb WHERE slug IN (SELECT distinct SPLIT_PART(provider_key, '#', 1) FROM signin_log WHERE provider = 'surveyAlias');`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('surveys', 'auth_modes', { transaction });
    }),
};
