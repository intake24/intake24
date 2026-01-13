import { createPermissions } from '../../utils.js';

const permissions = [
  { name: 'nutrient-types', display_name: 'Nutrient types resource access' },
  { name: 'nutrient-types|browse', display_name: 'Browse nutrient types' },
  { name: 'nutrient-types|read', display_name: 'Read nutrient types' },
  { name: 'nutrient-types|create', display_name: 'Create nutrient types' },
  { name: 'nutrient-types|edit', display_name: 'Edit nutrient types' },
  { name: 'nutrient-types|delete', display_name: 'Delete nutrient types' },
  { name: 'nutrient-units', display_name: 'Nutrient units resource access' },
  { name: 'nutrient-units|browse', display_name: 'Browse nutrient units' },
  { name: 'nutrient-units|read', display_name: 'Read nutrient units' },
  { name: 'nutrient-units|create', display_name: 'Create nutrient units' },
  { name: 'nutrient-units|edit', display_name: 'Edit nutrient units' },
  { name: 'nutrient-units|delete', display_name: 'Delete nutrient units' },
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
