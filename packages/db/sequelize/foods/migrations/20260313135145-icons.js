/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['categories', 'foods', 'standard_units'].map(table =>
          queryInterface.addColumn(
            table,
            'icon',
            {
              type: Sequelize.STRING(64),
              allowNull: true,
            },
            { transaction },
          ),
        ),
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await Promise.all(
        ['categories', 'foods', 'standard_units'].map(table =>
          queryInterface.removeColumn(table, 'icon', { transaction }),
        ),
      );
    }),
};
