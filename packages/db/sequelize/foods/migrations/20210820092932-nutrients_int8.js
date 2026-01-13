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

      await queryInterface.renameTable('nutrient_type_in_kcal', 'v3_nutrient_type_in_kcal', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE nutrient_type_in_kcal_id_seq RENAME TO v3_nutrient_type_in_kcal_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'nutrient_type_in_kcal',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          nutrient_type_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          kcal_per_unit: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('nutrient_type_in_kcal', {
        fields: ['nutrient_type_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'no action',
        onDelete: 'no action',
        name: 'nutrient_type_in_kcal_nutrient_type_id_fk',
        transaction,
      });

      await queryInterface.addIndex('nutrient_type_in_kcal', ['nutrient_type_id'], {
        name: 'nutrient_type_in_kcal_nutrient_type_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO nutrient_type_in_kcal (id, nutrient_type_id, kcal_per_unit) SELECT id, nutrient_type_id, kcal_per_unit FROM v3_nutrient_type_in_kcal',
        { transaction },
      );

      await updateSequence('nutrient_type_in_kcal', 'id', { queryInterface, transaction });

      await queryInterface.removeConstraint(
        'nutrient_table_record_nutrients',
        'nutrient_table_record_nutrients_nutrient_type_id_fkey',
        { transaction },
      );

      await queryInterface.addConstraint('nutrient_table_record_nutrients', {
        fields: ['nutrient_type_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'nutrient_table_record_nutrients_nutrient_type_id_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'food_groups_feedback_nutrient_ids',
        'nutrient_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint(
        'food_groups_feedback_nutrient_ids',
        'food_groups_feedback_group_ids_food_group_id_fkey',
        { transaction },
      );

      await queryInterface.addConstraint('food_groups_feedback_nutrient_ids', {
        fields: ['nutrient_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'no action',
        onDelete: 'no action',
        name: 'food_groups_feedback_nutrient_ids_nutrient_id_fk',
        transaction,
      });

      await queryInterface.changeColumn(
        'demographic_group',
        'nutrient_type_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint(
        'demographic_group',
        'demographic_group_nutrient_type_fk',
        { transaction },
      );

      await queryInterface.addConstraint('demographic_group', {
        fields: ['nutrient_type_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'no action',
        onDelete: 'no action',
        name: 'demographic_group_nutrient_type_id_fk',
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
