/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE languages
         SET code = :code, english_name = :englishName, local_name = :localName
         WHERE code = 'pt'`,
        {
          replacements: {
            code: 'pt-PT',
            englishName: 'Portuguese (Portugal)',
            localName: 'Português (Portugal)',
          },
          transaction,
        },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE languages
         SET code = :code, english_name = :englishName, local_name = :localName
         WHERE code = 'pt-PT'`,
        {
          replacements: {
            code: 'pt',
            englishName: 'Portuguese',
            localName: 'Português',
          },
          transaction,
        },
      );
    }),
};
