const tables = ['category_portion_size_methods', 'food_portion_size_methods'];

/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        tables.map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET "method" = 'auto', parameters = jsonb_build_object('mode', 'weight', 'value', default_weight) WHERE default_weight IS NOT NULL;`,
            { transaction },
          )),
      );

      await Promise.all(tables.map(table => queryInterface.removeColumn(table, 'default_weight', { transaction })));
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        tables.map(table =>
          queryInterface.addColumn(
            table,
            'default_weight',
            { type: Sequelize.FLOAT, allowNull: true },
            { transaction },
          )),
      );

      await Promise.all(
        tables.map(table =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET "method" = 'direct-weight', default_weight = jsonb_extract_path(parameters, 'value')::float, parameters = '{}'::jsonb WHERE "method" = 'auto';`,
            { transaction },
          )),
      );
    }),
};
