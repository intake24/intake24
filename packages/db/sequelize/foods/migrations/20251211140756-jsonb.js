/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        [
          'as_served_images',
          'as_served_sets',
          'drinkware_scales',
          'drinkware_scales_v2',
          'drinkware_sets',
          'guide_image_objects',
          'guide_images',
          'image_map_objects',
          'image_maps',
        ].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN label TYPE jsonb USING label::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['text', 'generic_name'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE associated_foods ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN parameters DROP DEFAULT;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN parameters TYPE jsonb USING parameters::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['categories', 'foods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN tags DROP DEFAULT;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['categories', 'foods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN tags TYPE jsonb USING tags::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['categories', 'foods'].map(table =>
          queryInterface.sequelize.query(
            `ALTER TABLE ${table} ALTER COLUMN tags SET DEFAULT '[]'::jsonb;`,
            { transaction },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE foods ALTER COLUMN alt_names DROP DEFAULT;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE foods ALTER COLUMN alt_names TYPE jsonb USING alt_names::jsonb;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE foods ALTER COLUMN alt_names SET DEFAULT '{}'::jsonb;`,
        { transaction },
      );

      await Promise.all(
        ['outline_coordinates', 'volume_samples', 'volume_samples_normalised'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE drinkware_scales_v2 ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE image_map_objects ALTER COLUMN outline_coordinates TYPE jsonb USING outline_coordinates::jsonb;`,
        { transaction },
      );

      await Promise.all(
        ['name', 'description'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE recipe_foods_steps ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );

      await Promise.all(
        ['estimate_in', 'how_many'].map(column =>
          queryInterface.sequelize.query(
            `ALTER TABLE standard_units ALTER COLUMN ${column} TYPE jsonb USING ${column}::jsonb;`,
            { transaction },
          ),
        ),
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        [
          'as_served_images',
          'as_served_sets',
          'drinkware_scales',
          'drinkware_scales_v2',
          'drinkware_sets',
          'guide_image_objects',
          'guide_images',
          'image_map_objects',
          'image_maps',
        ].map(table =>
          queryInterface.changeColumn(table, 'label', {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await Promise.all(
        ['text', 'generic_name'].map(column =>
          queryInterface.changeColumn('associated_foods', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await Promise.all(
        ['category_portion_size_methods', 'food_portion_size_methods'].map(table =>
          queryInterface.changeColumn(table, 'parameters', {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await Promise.all(
        ['categories', 'foods'].map(table =>
          queryInterface.changeColumn(table, 'tags', {
            allowNull: false,
            defaultValue: '[]',
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await queryInterface.changeColumn('foods', 'alt_names', {
        allowNull: false,
        defaultValue: '{}',
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await Promise.all(
        ['outline_coordinates', 'volume_samples', 'volume_samples_normalised'].map(column =>
          queryInterface.changeColumn('drinkware_scales_v2', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await queryInterface.changeColumn('image_map_objects', 'outline_coordinates', {
        allowNull: false,
        type: Sequelize.TEXT({ length: 'long' }),
      }, { transaction });

      await Promise.all(
        ['name', 'description'].map(column =>
          queryInterface.changeColumn('recipe_foods_steps', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );

      await Promise.all(
        ['estimate_in', 'how_many'].map(column =>
          queryInterface.changeColumn('standard_units', column, {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          }, { transaction }),
        ),
      );
    }),
};
