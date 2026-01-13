export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('user_permissions', 'v3_user_permissions', { transaction });
      await queryInterface.renameTable('user_roles', 'v3_user_roles', { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('v3_user_permissions', 'user_permissions', { transaction });
      await queryInterface.renameTable('v3_user_roles', 'user_roles', { transaction });
    }),
};
