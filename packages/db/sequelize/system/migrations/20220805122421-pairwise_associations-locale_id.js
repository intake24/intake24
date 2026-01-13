export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'pairwise_associations_co_occurrences',
        'locale',
        'locale_id',
        { transaction },
      );
      await queryInterface.renameColumn(
        'pairwise_associations_occurrences',
        'locale',
        'locale_id',
        { transaction },
      );
      await queryInterface.renameColumn(
        'pairwise_associations_transactions_count',
        'locale',
        'locale_id',
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'pairwise_associations_co_occurrences',
        'locale_id',
        'locale',
        { transaction },
      );
      await queryInterface.renameColumn(
        'pairwise_associations_occurrences',
        'locale_id',
        'locale',
        { transaction },
      );
      await queryInterface.renameColumn(
        'pairwise_associations_transactions_count',
        'locale_id',
        'locale',
        { transaction },
      );
    }),
};
