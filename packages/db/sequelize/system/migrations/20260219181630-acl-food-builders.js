/** @type {import('sequelize-cli').Migration} */
export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'locales:food-builders', description = 'Locale food builders' WHERE name = 'locales:recipe-foods';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE user_securables SET action = 'food-builders' WHERE securable_type = 'Locale' AND action = 'recipe-foods';`,
        { transaction },
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET name = 'locales:recipe-foods', description = 'Locale recipe foods' WHERE name = 'locales:food-builders';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE user_securables SET action = 'recipe-foods' WHERE securable_type = 'Locale' AND action = 'food-builders';`,
        { transaction },
      );
    }),
};
