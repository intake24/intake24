export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = replace("name", 'as-served', 'as-served-sets') where "name" like 'as-served%';`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = replace("name", 'as-served-sets', 'as-served') where "name" like 'as-served-sets%';`,
        { transaction },
      );
    }),
};
