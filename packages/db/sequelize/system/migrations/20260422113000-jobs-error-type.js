/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'jobs',
        'error_type',
        {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        { transaction },
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('jobs', 'error_type', { transaction });
    }),
};
