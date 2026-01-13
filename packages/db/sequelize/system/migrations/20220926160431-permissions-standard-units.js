import { createPermissions } from '../../utils.js';

const permissions = [
  { name: 'standard-units', display_name: 'Standard units resource access' },
  { name: 'standard-units|browse', display_name: 'Browse standard units' },
  { name: 'standard-units|read', display_name: 'Read standard units' },
  { name: 'standard-units|create', display_name: 'Create standard units' },
  { name: 'standard-units|edit', display_name: 'Edit standard units' },
  { name: 'standard-units|delete', display_name: 'Delete standard units' },
  { name: 'standard-units|categories', display_name: 'Standard unit categories' },
  { name: 'standard-units|foods', display_name: 'Standard unit foods' },
];

export default {
  up: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });
    }),
};
