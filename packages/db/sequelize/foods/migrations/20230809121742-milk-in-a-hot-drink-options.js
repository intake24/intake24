export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const value = {
        en: [
          { label: 'A little', value: 0.1 },
          { label: 'Average amount', value: 0.16 },
          { label: 'A lot', value: 0.24 },
        ],
      };

      await queryInterface.sequelize.query(
        `INSERT INTO category_portion_size_method_params (portion_size_method_id, "name", value) SELECT id, 'options', '${JSON.stringify(
          value,
        )}' FROM category_portion_size_methods where "method" = 'milk-in-a-hot-drink';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO food_portion_size_method_params (portion_size_method_id, "name", value) SELECT id, 'options', '${JSON.stringify(
          value,
        )}' FROM food_portion_size_methods where "method" = 'milk-in-a-hot-drink';`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM category_portion_size_method_params
          USING category_portion_size_methods
          WHERE category_portion_size_method_params.portion_size_method_id = category_portion_size_methods.id
          and category_portion_size_method_params."name" = 'options'
          and category_portion_size_methods."method" = 'milk-in-a-hot-drink';
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DELETE FROM food_portion_size_method_params
          USING food_portion_size_methods
          WHERE food_portion_size_method_params.portion_size_method_id = food_portion_size_methods.id
          and food_portion_size_method_params."name" = 'options'
          and food_portion_size_methods."method" = 'milk-in-a-hot-drink';
        `,
        { transaction },
      );
    }),
};
