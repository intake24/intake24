export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `INSERT INTO tasks("name", "job", "cron", "active", "description", "created_at", "updated_at")
        VALUES ('Purge refresh tokens', 'PurgeRefreshTokens', '0 * * * *', true, 'Regularly purge expired refresh tokens', NOW(), NOW())`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DELETE FROM tasks WHERE "name" = 'Purge refresh tokens'`,
        { transaction },
      );
    }),
};
