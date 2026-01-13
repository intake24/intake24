/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'survey_submission_external_sources',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          food_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          food_type: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          source: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          search_term: {
            type: Sequelize.STRING(256),
            allowNull: true,
          },
          type: {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          data: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('survey_submission_external_sources', {
        fields: ['food_id', 'food_type', 'source'],
        type: 'unique',
        name: 'survey_submission_external_sources_unique',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_external_sources', ['food_id', 'food_type'], {
        name: 'survey_submission_external_sources_compound_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('survey_submission_external_sources', ['source'], {
        name: 'survey_submission_external_sources_source_idx',
        indexType: 'btree',
        transaction,
      });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('survey_submission_external_sources', { transaction });
    });
  },
};
