/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'jobs',
        'error_details',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction },
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('jobs', 'error_details', { transaction });
    }),
};
