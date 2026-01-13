/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(['survey_submissions', 'survey_submission_meals', 'survey_submission_foods'].map(table =>
        queryInterface.addColumn(
          table,
          'custom_data',
          {
            type: Sequelize.JSONB(),
            allowNull: true,
          },
          { transaction },
        )));

      await queryInterface.sequelize.query(
        `UPDATE survey_submissions SET custom_data = scf.data FROM
       (
          SELECT scf.survey_submission_id, jsonb_object_agg(scf.name, scf.value) data
          FROM survey_submission_custom_fields scf
          GROUP BY scf.survey_submission_id
        ) AS scf
        WHERE survey_submissions.id = scf.survey_submission_id;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_meals SET custom_data = smcf.data FROM
       (
          SELECT smcf.meal_id, jsonb_object_agg(smcf.name, smcf.value) data
          FROM survey_submission_meal_custom_fields smcf
          GROUP BY smcf.meal_id
        ) AS smcf
        WHERE survey_submission_meals.id = smcf.meal_id;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods SET custom_data = sfcf.data FROM
       (
          SELECT sfcf.food_id, jsonb_object_agg(sfcf.name, sfcf.value) data
          FROM survey_submission_food_custom_fields sfcf
          GROUP BY sfcf.food_id
        ) AS sfcf
        WHERE survey_submission_foods.id = sfcf.food_id;`,
        { transaction },
      );

      await Promise.all(['fields', 'nutrients', 'portion_size'].map(column =>
        queryInterface.addColumn(
          'survey_submission_foods',
          column,
          {
            type: Sequelize.JSONB(),
            allowNull: true,
          },
          { transaction },
        )));

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods SET fields = f.data FROM
       (
          SELECT f.food_id, jsonb_object_agg(f.field_name, f.value) data
          FROM survey_submission_fields f
          GROUP BY f.food_id
        ) AS f
        WHERE survey_submission_foods.id = f.food_id;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods SET nutrients = n.data FROM
       (
          SELECT n.food_id, jsonb_object_agg(n.nutrient_type_id, n.amount) data
          FROM survey_submission_nutrients n
          GROUP BY n.food_id
        ) AS n
        WHERE survey_submission_foods.id = n.food_id;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE survey_submission_foods SET portion_size = p.data FROM
       (
          SELECT p.food_id, jsonb_object_agg(p.name, p.value) data
          FROM survey_submission_portion_size_fields p
          GROUP BY p.food_id
        ) AS p
        WHERE survey_submission_foods.id = p.food_id;`,
        { transaction },
      );

      await Promise.all([
        'survey_submission_custom_fields',
        'survey_submission_meal_custom_fields',
        'survey_submission_food_custom_fields',
        'survey_submission_fields',
        'survey_submission_nutrients',
        'survey_submission_portion_size_fields',
      ].map(table =>
        queryInterface.dropTable(table, { transaction })));
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
