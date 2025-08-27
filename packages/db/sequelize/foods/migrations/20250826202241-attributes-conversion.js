/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Attributes to tags
      await Promise.all([
        queryInterface.addColumn(
          'category_locals',
          'exclude_tags',
          {
            type: Sequelize.STRING(2048),
            allowNull: false,
            defaultValue: '[]',
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'food_locals',
          'exclude_tags',
          {
            type: Sequelize.STRING(2048),
            allowNull: false,
            defaultValue: '[]',
          },
          { transaction },
        ),
      ]);

      // Same as before
      await queryInterface.sequelize.query(
        `UPDATE category_locals SET tags = (tags::jsonb || '["same-as-before"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.same_as_before_option = true;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_locals SET exclude_tags = (exclude_tags::jsonb || '["same-as-before"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.same_as_before_option = false;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET tags = (tags::jsonb || '["same-as-before"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.same_as_before_option = true;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET exclude_tags = (exclude_tags::jsonb || '["same-as-before"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.same_as_before_option = false;`,
        { transaction },
      );

      // Ready meal
      await queryInterface.sequelize.query(
        `UPDATE category_locals SET tags = (tags::jsonb || '["ready-meal"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.ready_meal_option = true;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_locals SET exclude_tags = (exclude_tags::jsonb || '["ready-meal"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.ready_meal_option = false;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET tags = (tags::jsonb || '["ready-meal"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.ready_meal_option = true;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET exclude_tags = (exclude_tags::jsonb || '["ready-meal"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.ready_meal_option = false;`,
        { transaction },
      );

      // Use in recipes
      await queryInterface.sequelize.query(
        `UPDATE category_locals SET tags = (tags::jsonb || '["use-anywhere"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.use_in_recipes = 0;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_locals SET tags = (tags::jsonb || '["use-as-food"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.use_in_recipes = 1;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_locals SET tags = (tags::jsonb || '["use-as-ingredient"]'::jsonb)::text FROM category_attributes
          WHERE category_locals.category_code = category_attributes.category_code AND category_attributes.use_in_recipes = 2;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET tags = (tags::jsonb || '["use-anywhere"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.use_in_recipes = 0;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET tags = (tags::jsonb || '["use-as-food"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.use_in_recipes = 1;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_locals SET tags = (tags::jsonb || '["use-as-ingredient"]'::jsonb)::text FROM food_attributes
          WHERE food_locals.food_code = food_attributes.food_code AND food_attributes.use_in_recipes = 2;`,
        { transaction },
      );
    });
  },

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
