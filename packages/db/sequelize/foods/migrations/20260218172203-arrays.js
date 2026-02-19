const data = [
  ['categories', 'tags', 'TEXT'],
  ['foods', 'tags', 'TEXT'],
  ['image_map_objects', 'outline_coordinates', 'FLOAT'],
  ['drinkware_scales_v2', 'outline_coordinates', 'FLOAT'],
  ['drinkware_scales_v2', 'volume_samples', 'FLOAT'],
  ['drinkware_scales_v2', 'volume_samples_normalised', 'FLOAT'],
];

/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        data.map(([table, column]) =>
          queryInterface.renameColumn(table, column, `${column}_old`, { transaction }),
        ),
      );

      await Promise.all(
        data.map(([table, column, type]) =>
          queryInterface.addColumn(
            table,
            column,
            {
              type: Sequelize.ARRAY(Sequelize[type]),
              allowNull: column !== 'tags',
              defaultValue: column === 'tags' ? [] : undefined,
            },
            { transaction },
          )),
      );

      await Promise.all(
        data.map(([table, column, type]) =>
          queryInterface.sequelize.query(
            `UPDATE ${table} SET ${column} = ARRAY(SELECT jsonb_array_elements_text(${column}_old))::${type}[];`,
            { transaction },
          )),
      );

      await Promise.all(
        data.map(([table, column, type]) =>
          queryInterface.changeColumn(table, column, {
            type: Sequelize.ARRAY(Sequelize[type]),
            allowNull: false,
          }, { transaction }),
        ),
      );

      await Promise.all(
        data.map(([table, column]) =>
          queryInterface.removeColumn(table, `${column}_old`, { transaction }),
        ),
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        data.map(([table, column]) =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN ${column} TYPE jsonb USING to_jsonb(${column});`,
            { transaction },
          )),
      );
    }),
};
