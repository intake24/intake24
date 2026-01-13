export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'user_physical_data',
        'sex',
        { type: Sequelize.STRING(64), allowNull: true },
        { transaction },
      );

      await queryInterface.changeColumn(
        'user_physical_data',
        'weight_kg',
        { type: Sequelize.DOUBLE, allowNull: true },
        { transaction },
      );

      await queryInterface.changeColumn(
        'user_physical_data',
        'height_cm',
        { type: Sequelize.DOUBLE, allowNull: true },
        { transaction },
      );

      await queryInterface.changeColumn(
        'user_physical_data',
        'physical_activity_level_id',
        { type: Sequelize.BIGINT, allowNull: true },
        { transaction },
      );

      await queryInterface.changeColumn(
        'user_physical_data',
        'weight_target',
        { type: Sequelize.STRING(64), allowNull: true },
        { transaction },
      );

      await queryInterface.removeConstraint('user_physical_data', 'realistic_height', {
        transaction,
      });

      await queryInterface.removeConstraint('user_physical_data', 'realistic_weight', {
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
