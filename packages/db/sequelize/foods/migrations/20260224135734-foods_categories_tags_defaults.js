/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE foods ALTER COLUMN tags SET DEFAULT ARRAY[]::text[];`,
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE categories ALTER COLUMN tags SET DEFAULT ARRAY[]::text[];`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE foods ALTER COLUMN tags DROP DEFAULT;`,
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE categories ALTER COLUMN tags DROP DEFAULT;`,
    );
  },
};
