/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.addColumn(
            table,
            'pathways',
            { type: Sequelize.JSONB, allowNull: true },
            { transaction },
          )),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET pathways = '["search", "afp"]'::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET pathways = pathways || '["recipe"]'::jsonb WHERE use_for_recipes = true;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.changeColumn(
            table,
            'pathways',
            {
              type: Sequelize.JSONB,
              allowNull: false,
            },
            { transaction },
          )),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods']
          .map(table =>
            queryInterface.removeColumn(table, 'use_for_recipes', { transaction }),
          ),
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.addColumn(
            table,
            'use_for_recipes',
            {
              type: Sequelize.BOOLEAN,
              allowNull: true,
            },
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET use_for_recipes = false`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET use_for_recipes = true WHERE pathways @> '["recipe"]'::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.changeColumn(
            table,
            'use_for_recipes',
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
            },
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods']
          .map(table =>
            queryInterface.removeColumn(table, 'pathways', { transaction }),
          ),
      );
    }),
};
