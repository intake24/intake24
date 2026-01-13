/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        [
          'survey_submission_custom_fields',
          'survey_submission_meal_custom_fields',
          'survey_submission_food_custom_fields',
        ].map(table =>
          queryInterface.changeColumn(
            table,
            'value',
            {
              type: Sequelize.STRING(2048),
              allowNull: false,
            },
            { transaction },
          ),
        ),
      );

      await Promise.all(
        [
          ['survey_submission_custom_fields', 'survey_submission_id'],
          ['survey_submission_meal_custom_fields', 'meal_id'],
          ['survey_submission_food_custom_fields', 'food_id'],
          ['user_custom_fields', 'user_id'],
        ].map(([table, fkFieldName]) =>
          queryInterface.addConstraint(
            table,
            {
              fields: [fkFieldName, 'name'],
              type: 'unique',
              name: `${table}_unique`,
              transaction,
            },
          ),
        ),
      );

      await queryInterface.addConstraint('users', {
        fields: ['email'],
        type: 'unique',
        name: 'users_email_unique',
        transaction,
      });
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        [
          'survey_submission_custom_fields',
          'survey_submission_meal_custom_fields',
          'survey_submission_food_custom_fields',
        ].map(table =>
          queryInterface.changeColumn(
            table,
            'value',
            {
              type: Sequelize.STRING(512),
              allowNull: false,
            },
            { transaction },
          ),
        ),
      );

      await Promise.all(
        [
          'survey_submission_custom_fields',
          'survey_submission_meal_custom_fields',
          'survey_submission_food_custom_fields',
          'user_custom_fields',
        ].map(table =>
          queryInterface.removeConstraint(table, `${table}_unique`, { transaction }),
        ),
      );

      await queryInterface.removeConstraint('users', 'users_email_unique', { transaction });
    });
  },
};
