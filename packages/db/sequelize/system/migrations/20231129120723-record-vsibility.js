import { createPermissions } from '../../utils.js';

const tables = ['languages', 'locales', 'feedback_schemes', 'survey_schemes'];

const permissions = [
  { name: 'languages|use', display_name: 'Languages use' },
  { name: 'locales|use', display_name: 'Locales use' },
  { name: 'feedback-schemes|use', display_name: 'Feedback schemes use' },
  { name: 'survey-schemes|use', display_name: 'Survey schemes use' },
];

export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        tables.map(table =>
          queryInterface.addColumn(
            table,
            'visibility',
            {
              type: Sequelize.STRING(32),
              allowNull: false,
              defaultValue: 'public',
            },
            { transaction },
          ),
        ),
      );

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        tables.map(table => queryInterface.removeColumn(table, 'visibility', { transaction })),
      );

      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });
    }),
};
