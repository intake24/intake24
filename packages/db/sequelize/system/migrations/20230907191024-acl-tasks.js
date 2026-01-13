export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'nutrient-tables|tasks', display_name = 'Nutrient tables tasks' WHERE name = 'nutrient-tables|upload';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'surveys|tasks', display_name = 'Surveys tasks' WHERE name = 'surveys|data-export';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE user_securables set action = 'tasks' where "action" = 'data-export' and securable_type = 'Survey';`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'nutrient-tables|upload', display_name = 'Nutrient tables upload' WHERE name = 'nutrient-tables|tasks';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'surveys|data-export ', display_name = 'Surveys data export' WHERE name = 'surveys|tasks';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE user_securables set action = 'data-export' where "action" = 'tasks' and securable_type = 'Survey';`,
        { transaction },
      );
    }),
};
