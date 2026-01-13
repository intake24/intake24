import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('nutrient_units', 'v3_nutrient_units', { transaction });

      await queryInterface.createTable(
        'nutrient_units',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
          },
          description: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          symbol: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO nutrient_units (id, description, symbol) SELECT id, description, symbol FROM v3_nutrient_units',
        { transaction },
      );

      await queryInterface.renameTable('nutrient_types', 'v3_nutrient_types', { transaction });

      await queryInterface.createTable(
        'nutrient_types',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
          },
          description: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          unit_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('nutrient_types', {
        fields: ['unit_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_units',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'nutrient_types_unit_id_fk',
        transaction,
      });

      await queryInterface.addIndex('nutrient_types', ['unit_id'], {
        name: 'nutrient_types_unit_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO nutrient_types (id, description, unit_id) SELECT id, description, unit_id FROM v3_nutrient_types',
        { transaction },
      );

      await queryInterface.renameTable('missing_foods', 'v3_missing_foods', { transaction });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE missing_foods_id_seq RENAME TO v3_missing_foods_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'missing_foods',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          survey_id: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          user_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          brand: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          portion_size: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          leftovers: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          submitted_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('missing_foods', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'missing_foods_survey_id_fk',
        transaction,
      });

      await queryInterface.addIndex('missing_foods', ['survey_id'], {
        name: 'missing_foods_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('missing_foods', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'missing_foods_user_id_fk',
        transaction,
      });

      await queryInterface.addIndex('missing_foods', ['user_id'], {
        name: 'missing_foods_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO missing_foods (id, survey_id, user_id, "name", brand, description, portion_size, leftovers, submitted_at) SELECT id, survey_id, user_id, "name", brand, description, portion_size, leftovers, submitted_at FROM v3_missing_foods',
        { transaction },
      );

      await updateSequence('missing_foods', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
