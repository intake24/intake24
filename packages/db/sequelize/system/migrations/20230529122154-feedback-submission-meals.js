import { createPermissions } from '../../utils.js';

const defaultMeals = { chart: { colors: [], nutrients: [] }, table: { fields: [] } };
const defaultSections = ['cards', 'topFoods'];

const permissions = [{ name: 'feedback-schemes|meals', display_name: 'Feedback scheme meals' }];

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'survey_submission_meals',
        'duration',
        {
          allowNull: true,
          type: Sequelize.INTEGER,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'feedback_schemes',
        'sections',
        { allowNull: true, type: Sequelize.TEXT },
        { transaction },
      );

      await queryInterface.addColumn(
        'feedback_schemes',
        'meals',
        { allowNull: true, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE feedback_schemes SET meals = :meals, sections = :sections;`,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          replacements: {
            meals: JSON.stringify(defaultMeals),
            sections: JSON.stringify(defaultSections),
          },
          transaction,
        },
      );

      await queryInterface.changeColumn(
        'feedback_schemes',
        'sections',
        { allowNull: false, type: Sequelize.TEXT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'feedback_schemes',
        'meals',
        { allowNull: false, type: Sequelize.TEXT({ length: 'long' }) },
        { transaction },
      );

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('survey_submission_meals', 'duration', { transaction });
      await queryInterface.removeColumn('feedback_schemes', 'sections', { transaction });
      await queryInterface.removeColumn('feedback_schemes', 'meals', { transaction });

      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });
    }),
};
