/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Both settings columns are stored as TEXT (not JSONB), so we need to cast
    // Add 'enabled: true' to settings.help for all survey_schemes
    await queryInterface.sequelize.query(`
      UPDATE survey_schemes
      SET settings = jsonb_set(settings::jsonb, '{help,enabled}', 'true')::text
      WHERE (settings::jsonb)->'help' IS NOT NULL
        AND (settings::jsonb)->'help'->>'enabled' IS NULL;
    `);

    // Also update surveys that have scheme overrides with help settings
    // survey_scheme_overrides is also TEXT, need to cast
    await queryInterface.sequelize.query(`
      UPDATE surveys
      SET survey_scheme_overrides = jsonb_set(
        survey_scheme_overrides::jsonb,
        '{settings,help,enabled}',
        'true'::jsonb
      )::text
      WHERE (survey_scheme_overrides::jsonb)->'settings'->'help' IS NOT NULL
        AND (survey_scheme_overrides::jsonb)->'settings'->'help'->>'enabled' IS NULL;
    `);
  },

  async down(queryInterface) {
    // Remove 'enabled' from settings.help for all survey_schemes
    await queryInterface.sequelize.query(`
      UPDATE survey_schemes
      SET settings = ((settings::jsonb) #- '{help,enabled}')::text
      WHERE (settings::jsonb)->'help'->'enabled' IS NOT NULL;
    `);

    // Also remove from surveys that have scheme overrides
    await queryInterface.sequelize.query(`
      UPDATE surveys
      SET survey_scheme_overrides = ((survey_scheme_overrides::jsonb) #- '{settings,help,enabled}')::text
      WHERE (survey_scheme_overrides::jsonb)->'settings'->'help'->'enabled' IS NOT NULL;
    `);
  },
};
