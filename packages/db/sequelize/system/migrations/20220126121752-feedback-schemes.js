import { createPermissions } from '../../utils.js';

const permissions = [
  { name: 'feedback-schemes|browse', display_name: 'Browse feedback schemes' },
  { name: 'feedback-schemes|read', display_name: 'Read feedback schemes' },
  { name: 'feedback-schemes|create', display_name: 'Create feedback schemes' },
  { name: 'feedback-schemes|edit', display_name: 'Edit feedback schemes' },
  { name: 'feedback-schemes|delete', display_name: 'Delete feedback schemes' },
  { name: 'feedback-schemes|top-foods', display_name: 'Feedback scheme top foods' },
  { name: 'feedback-schemes|food-groups', display_name: 'Feedback scheme food groups' },
];

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const created_at = new Date();
      const updated_at = created_at;

      await queryInterface.createTable(
        'feedback_schemes',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(256),
            unique: true,
          },
          type: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
          top_foods: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          food_groups: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          henry_coefficients: {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'feedback_schemes',
        [
          {
            name: 'Default feedback',
            type: 'default',
            top_foods: JSON.stringify({
              max: 5,
              colors: ['#FF6384', '#36A2EB', '#FFCE56', '#9c27b0', '#8bc34a', '#999999'],
              nutrientTypes: [
                { id: '1', name: { en: 'Energy' } },
                { id: '23', name: { en: 'Sugar' } },
                { id: '50', name: { en: 'Saturated fat' } },
              ],
            }),
            food_groups: JSON.stringify([]),
            henry_coefficients: null,
            created_at,
            updated_at,
          },
        ],
        { transaction },
      );

      const feedbackScheme = await queryInterface.sequelize.query(
        `SELECT id FROM feedback_schemes WHERE name IN (:name);`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { name: 'Default feedback' },
          transaction,
        },
      );

      await queryInterface.addColumn(
        'surveys',
        'feedback_scheme_id',
        { type: Sequelize.BIGINT, allowNull: true },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE surveys SET feedback_scheme_id = :id WHERE feedback_enabled = true;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: { id: feedbackScheme[0].id },
          transaction,
        },
      );

      await queryInterface.addConstraint('surveys', {
        fields: ['feedback_scheme_id'],
        type: 'foreign key',
        references: {
          table: 'feedback_schemes',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'surveys_feedback_scheme_id_fk',
        transaction,
      });

      await createPermissions(permissions, { queryInterface, transaction });

      await queryInterface.removeColumn('surveys', 'feedback_enabled', { transaction });
      await queryInterface.removeColumn('surveys', 'feedback_style', { transaction });
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'feedback_enabled',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );

      await queryInterface.addColumn(
        'surveys',
        'feedback_style',
        { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'default' },
        { transaction },
      );

      await queryInterface.removeColumn('surveys', 'feedback_scheme_id', { transaction });

      await queryInterface.dropTable('feedback_schemes', { transaction });

      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });
    }),
};
