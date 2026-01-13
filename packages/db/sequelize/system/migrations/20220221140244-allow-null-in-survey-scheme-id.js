// This column needs to be deleted eventually but keeping for now to prevent losing data
// when applying to v3 database snapshots

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('surveys', 'scheme_id', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('surveys', 'scheme_id', {
      type: Sequelize.STRING(64),
      allowNull: false,
    });
  },
};
