const { camelCase } = require('lodash-es');

function parseValue(oldValue) {
  if (['false', 'true'].includes(oldValue))
    return oldValue === 'true';

  if (!Number.isNaN(Number.parseFloat(oldValue)))
    return Number.parseFloat(oldValue);

  return oldValue;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'category_portion_size_methods',
        'parameters',
        { type: Sequelize.TEXT({ length: 'long' }), allowNull: false, defaultValue: '{}' },
        { transaction },
      );
      await queryInterface.addColumn(
        'food_portion_size_methods',
        'parameters',
        { type: Sequelize.TEXT({ length: 'long' }), allowNull: false, defaultValue: '{}' },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE category_portion_size_methods SET parameters = cpsmp.params FROM
        (
          SELECT portion_size_method_id, jsonb_object_agg(name, value) params
          FROM category_portion_size_method_params
          GROUP BY portion_size_method_id
        ) AS cpsmp
        WHERE category_portion_size_methods.id = cpsmp.portion_size_method_id;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_portion_size_methods SET parameters = fpsmp.params FROM
        (
          SELECT portion_size_method_id, jsonb_object_agg(name, value) params
          FROM food_portion_size_method_params
          GROUP BY portion_size_method_id
        ) AS fpsmp
        WHERE food_portion_size_methods.id = fpsmp.portion_size_method_id;`,
        { transaction },
      );

      for (const table of ['category_portion_size_methods', 'food_portion_size_methods']) {
        const records = await queryInterface.sequelize.query(
          `SELECT id, method, parameters FROM ${table};`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
        );

        for (const record of records) {
          const { id, method } = record;
          const parameters = JSON.parse(record.parameters);

          const newParameters = method === 'standard-portion' ? { units: [] } : {};

          const suCount = Object.keys(parameters).filter(item => item.endsWith('-name')).length;
          if (method === 'standard-portion' && suCount) {
            for (let i = 0; i < suCount; ++i) {
              newParameters.units.push({
                name: parameters[`unit${i}-name`],
                weight: parseValue(parameters[`unit${i}-weight`]),
                omitFoodDescription: parseValue(parameters[`unit${i}-omit-food-description`]),
                inlineHowMany: parameters[`unit${i}-inline-how-many`],
                inlineEstimateIn: parameters[`unit${i}-inline-estimate-in`],
              });
            }
          }

          Object.entries(parameters).forEach(([oldKey, oldValue]) => {
            if (oldKey.startsWith('unit'))
              return;

            const key = camelCase(oldKey);
            const value = oldKey === 'options' ? JSON.parse(oldValue) : parseValue(oldValue);

            newParameters[key] = value;
          });

          await queryInterface.sequelize.query(
            `UPDATE ${table} SET parameters = :parameters WHERE id = :id;`,
            {
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              replacements: { id, parameters: JSON.stringify(newParameters) },
              transaction,
            },
          );
        }
      }
      await queryInterface.dropTable('category_portion_size_method_params', { transaction });
      await queryInterface.dropTable('food_portion_size_method_params', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
