/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    // "enum_media_disk" is what Sequelize expects this enum type to be called
    // and it appears there is no way to change it in the Sequelize model
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `CREATE TYPE enum_media_disk AS ENUM ('public', 'private')`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE media ALTER COLUMN disk TYPE enum_media_disk USING disk::enum_media_disk`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE media ALTER COLUMN disk TYPE VARCHAR(32)`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `DROP TYPE enum_media_disk`,
        { transaction },
      );
    }),
};
