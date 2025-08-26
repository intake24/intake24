const { createPermissions } = require('../../utils.js');

const permissions = [
  { name: 'media', display_name: 'Media resource' },
  { name: 'media:browse', display_name: 'Browse media' },
  { name: 'media:create', display_name: 'Create media' },
  { name: 'media:read', display_name: 'Read media' },
  { name: 'media:edit', display_name: 'Edit media' },
  { name: 'media:delete', display_name: 'Delete media' },
  { name: 'faqs:media', display_name: 'FAQ media' },
  { name: 'feedback-schemes:media', display_name: 'Feedback media' },
  { name: 'survey-schemes:media', display_name: 'Survey schemes media' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'media',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
          },
          model_type: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          model_id: {
            type: Sequelize.STRING(36),
            allowNull: true,
          },
          disk: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          collection: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
          filename: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
          mimetype: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
          size: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'media',
        ['model_id', 'model_type'],
        {
          name: 'media_model_id_idx',
          indexType: 'btree',
          transaction,
        },
      );

      await queryInterface.addIndex('media', ['collection'], {
        name: 'media_collection_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('media', ['name'], {
        name: 'media_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('media', ['filename'], {
        name: 'media_filename_idx',
        indexType: 'btree',
        transaction,
      });

      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const names = permissions.map(({ name }) => `'${name}'`).join(`,`);
      await queryInterface.sequelize.query(`DELETE FROM permissions WHERE name IN (${names});`, {
        transaction,
      });

      await queryInterface.dropTable('media', { transaction });
    }),
};
