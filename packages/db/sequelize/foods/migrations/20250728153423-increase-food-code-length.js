module.exports = {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Update foods table
      await queryInterface.changeColumn(
        'foods',
        'code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update associated_foods table
      await queryInterface.changeColumn(
        'associated_foods',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'associated_food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'associated_category_code',
        {
          type: Sequelize.STRING(32),
          allowNull: true,
        },
        { transaction },
      );

      // Update foods_categories table
      await queryInterface.changeColumn(
        'foods_categories',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'foods_categories',
        'category_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update categories table
      await queryInterface.changeColumn(
        'categories',
        'code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update brands table
      await queryInterface.changeColumn(
        'brands',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update foods_local_lists table
      await queryInterface.changeColumn(
        'foods_local_lists',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update food_attributes table
      await queryInterface.changeColumn(
        'food_attributes',
        'food_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update categories_categories table
      await queryInterface.changeColumn(
        'categories_categories',
        'subcategory_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'categories_categories',
        'category_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update category_attributes table
      await queryInterface.changeColumn(
        'category_attributes',
        'category_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );

      // Update category_locals table
      await queryInterface.changeColumn(
        'category_locals',
        'category_code',
        {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        { transaction },
      );
    }),

  down: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Revert foods table
      await queryInterface.changeColumn(
        'foods',
        'code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert associated_foods table
      await queryInterface.changeColumn(
        'associated_foods',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'associated_food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'associated_category_code',
        {
          type: Sequelize.STRING(8),
          allowNull: true,
        },
        { transaction },
      );

      // Revert foods_categories table
      await queryInterface.changeColumn(
        'foods_categories',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'foods_categories',
        'category_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert categories table
      await queryInterface.changeColumn(
        'categories',
        'code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert brands table
      await queryInterface.changeColumn(
        'brands',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert foods_local_lists table
      await queryInterface.changeColumn(
        'foods_local_lists',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert food_attributes table
      await queryInterface.changeColumn(
        'food_attributes',
        'food_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert categories_categories table
      await queryInterface.changeColumn(
        'categories_categories',
        'subcategory_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'categories_categories',
        'category_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert category_attributes table
      await queryInterface.changeColumn(
        'category_attributes',
        'category_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );

      // Revert category_locals table
      await queryInterface.changeColumn(
        'category_locals',
        'category_code',
        {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        { transaction },
      );
    }),
};
