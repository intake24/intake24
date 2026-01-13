import { createPermissions } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'language_translations',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          language_id: {
            type: Sequelize.STRING(8),
            allowNull: false,
          },
          application: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          section: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          messages: {
            type: Sequelize.TEXT({ length: 'long' }),
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

      await queryInterface.addConstraint('language_translations', {
        fields: ['language_id'],
        type: 'foreign key',
        references: {
          table: 'languages',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'language_translations_language_id_fk',
        transaction,
      });

      await queryInterface.addIndex('language_translations', ['language_id'], {
        name: 'language_translations_language_id_idx',
        indexType: 'btree',
        transaction,
      });

      const permissions = [
        { name: 'languages-translations', display_name: 'Language translations' },
      ];
      await createPermissions(permissions, { queryInterface, transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('language_translations', { transaction });

      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE name IN ('languages-translations');`,
        { transaction },
      );
    }),
};
