/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('food_locals', 'tags', {
      type: Sequelize.STRING(12288),
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to the original length (adjust 255 to whatever your original length was)
    await queryInterface.changeColumn('food_locals', 'tags', {
      type: Sequelize.STRING(2048),
      allowNull: false,
    });
  },
};
