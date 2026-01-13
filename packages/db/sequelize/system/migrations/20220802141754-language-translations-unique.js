export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint('language_translations', {
        fields: ['language_id', 'application', 'section'],
        type: 'unique',
        name: 'language_translations_unique',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'language_translations',
        'language_translations_unique',
        { transaction },
      );
    }),
};
