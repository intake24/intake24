import { createPermissions } from '../../utils.js';

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const permissions = [
        { name: 'drinkware-sets', display_name: 'Drinkware sets resource access' },
        { name: 'drinkware-sets|browse', display_name: 'Browse drinkware sets' },
        { name: 'drinkware-sets|read', display_name: 'Read drinkware sets' },
        { name: 'drinkware-sets|create', display_name: 'Create drinkware sets' },
        { name: 'drinkware-sets|edit', display_name: 'Edit drinkware sets' },
        { name: 'drinkware-sets|delete', display_name: 'Delete drinkware sets' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name ilike 'drinkware-sets%';`,
        { transaction },
      );
    }),
};
