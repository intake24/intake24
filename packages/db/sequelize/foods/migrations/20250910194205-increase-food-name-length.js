module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Increase the character limit for food name from 128 to 384
    await queryInterface.changeColumn('foods', 'name', {
      type: Sequelize.STRING(384),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the character limit for food name back to 128
    await queryInterface.changeColumn('foods', 'name', {
      type: Sequelize.STRING(128),
      allowNull: false,
    });
  },
};
