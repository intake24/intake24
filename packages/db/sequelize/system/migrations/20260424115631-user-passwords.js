/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('user_passwords', 'password_hash', 'hash', { transaction });
      await queryInterface.renameColumn('user_passwords', 'password_salt', 'salt', { transaction });
      await queryInterface.renameColumn('user_passwords', 'password_hasher', 'hasher', { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('user_passwords', 'hash', 'password_hash', { transaction });
      await queryInterface.renameColumn('user_passwords', 'salt', 'password_salt', { transaction });
      await queryInterface.renameColumn('user_passwords', 'hasher', 'password_hasher', { transaction });
    }),
};
