const resources = [
  'fdbs',
  'food-groups',
  'nutrient-tables',

  'locales',
  'languages',

  'as-served',
  'image-maps',
  'guide-images',

  'schemes',
  'scheme-questions',
  'surveys',

  'jobs',
  'tasks',
  'sign-in-logs',

  'users',
  'roles',
  'permissions',
];

export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      for (const item of resources) {
        await queryInterface.sequelize.query(
          `UPDATE permissions SET "name" = REPLACE("name", '${item}-', '${item}|') WHERE "name" LIKE '${item}-%';`,
          { transaction },
        );
      }
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      for (const item of resources) {
        await queryInterface.sequelize.query(
          `UPDATE permissions SET "name" = REPLACE("name", '${item}|', '${item}-') WHERE "name" LIKE '${item}|%';`,
          { transaction },
        );
      }
    }),
};
