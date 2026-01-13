export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = lower("name") WHERE "name" ilike '%/respondent';`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = surveys.slug || '/respondent' FROM surveys WHERE lower(permissions."name") = lower(surveys.slug) || '/respondent';`,
        { transaction },
      );
    }),
};
