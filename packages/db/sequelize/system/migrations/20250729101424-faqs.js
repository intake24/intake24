const { createPermissions } = require('../../utils.js');

const permissions = [
  { name: 'faqs', display_name: 'FAQ resource access' },
  { name: 'faqs:browse', display_name: 'Browse FAQs' },
  { name: 'faqs:read', display_name: 'Read FAQ' },
  { name: 'faqs:create', display_name: 'Create FAQ' },
  { name: 'faqs:edit', display_name: 'Edit FAQ' },
  { name: 'faqs:delete', display_name: 'Delete FAQ' },
  { name: 'faqs:copy', display_name: 'Copy FAQ' },
  { name: 'faqs:securables', display_name: 'FAQ security' },
  { name: 'faqs:use', display_name: 'FAQ use' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'faqs',
        {
          id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(256),
            unique: true,
          },
          content: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          owner_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          visibility: {
            type: Sequelize.STRING(32),
            allowNull: false,
            defaultValue: 'public',
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

      await queryInterface.addColumn(
        'surveys',
        'faq_id',
        { type: Sequelize.BIGINT, allowNull: true },
        { transaction },
      );

      await queryInterface.addConstraint('surveys', {
        fields: ['faq_id'],
        type: 'foreign key',
        references: {
          table: 'faqs',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'surveys_faq_id_fk',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['faq_id'], {
        name: 'surveys_faq_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('faqs', {
        fields: ['owner_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'faqs_owner_id_fk',
        transaction,
      });

      await queryInterface.addIndex('faqs', ['name'], {
        name: 'faqs_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('faqs', ['owner_id'], {
        name: 'faqs_owner_id_idx',
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

      await queryInterface.removeColumn('surveys', 'faq_id', { transaction });

      await queryInterface.dropTable('faqs', { transaction });
    }),
};
