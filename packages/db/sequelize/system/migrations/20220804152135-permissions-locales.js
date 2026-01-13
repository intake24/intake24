import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'locales|split-lists', display_name: 'Locale split lists' },
        { name: 'locales|split-words', display_name: 'Locale split words' },
        { name: 'locales|synonym-sets', display_name: 'Locale synonym sets' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name IN ('locales|split-lists', 'locales|split-words', 'locales|synonym-sets');`,
        { transaction },
      );
    }),
};
