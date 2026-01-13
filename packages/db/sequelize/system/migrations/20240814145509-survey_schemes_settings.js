/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn('survey_schemes', 'type', {
        type: Sequelize.TEXT({ long: true }),
        allowNull: false,
      }, { transaction });

      await queryInterface.sequelize.query(`UPDATE survey_schemes SET type = jsonb_build_object('type', "type");`, {
        transaction,
      });

      await queryInterface.renameColumn('survey_schemes', 'type', 'settings', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('survey_schemes', 'settings', 'type', { transaction });

      await queryInterface.sequelize.query(`UPDATE survey_schemes SET type = type::jsonb->>'type';`, {
        transaction,
      });

      await queryInterface.changeColumn('survey_schemes', 'type', {
        type: Sequelize.STRING(64),
        allowNull: false,
      }, { transaction });
    });
  },
};
