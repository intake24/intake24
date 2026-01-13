export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('surveys', 'locale', 'locale_id', { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('surveys', 'locale_id', 'locale', { transaction });
    }),
};
