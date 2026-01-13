import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('synonym_sets', 'v3_synonym_sets', { transaction });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE synonym_sets_id_seq RENAME TO v3_synonym_sets_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'synonym_sets',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          synonyms: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('synonym_sets', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'synonym_sets_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('synonym_sets', ['locale_id'], {
        name: 'synonym_sets_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO synonym_sets (id, locale_id, synonyms) SELECT id, locale_id, synonyms FROM v3_synonym_sets',
        { transaction },
      );

      await updateSequence('synonym_sets', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('split_words', 'v3_split_words', { transaction });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE split_words_id_seq RENAME TO v3_split_words_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'split_words',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          words: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('split_words', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'split_words_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('split_words', ['locale_id'], {
        name: 'split_words_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO split_words (id, locale_id, words) SELECT id, locale_id, words FROM v3_split_words',
        { transaction },
      );

      await updateSequence('split_words', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('split_list', 'v3_split_list', { transaction });

      await queryInterface.createTable(
        'split_lists',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          locale_id: {
            type: Sequelize.STRING(16),
            allowNull: false,
          },
          first_word: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          words: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('split_lists', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'split_lists_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('split_lists', ['locale_id'], {
        name: 'split_lists_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO split_lists (id, locale_id, first_word, words) SELECT id, locale_id, first_word, words FROM v3_split_list',
        { transaction },
      );

      await updateSequence('split_lists', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
