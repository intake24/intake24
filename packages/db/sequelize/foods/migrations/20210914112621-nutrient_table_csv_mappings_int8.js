import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable(
        'nutrient_table_csv_mapping_field_columns',
        'v3_nutrient_table_csv_mapping_field_columns',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_nutrient_table_csv_mapping_field_columns RENAME CONSTRAINT nutrient_table_csv_mapping_field_columns_pkey TO v3_nutrient_table_csv_mapping_field_columns_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_nutrient_table_csv_mapping_field_columns RENAME CONSTRAINT nutrient_table_csv_mapping_field_columns_unique TO v3_nutrient_table_csv_mapping_field_columns_unique;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE nutrient_table_csv_mapping_field_columns_id_seq RENAME TO v3_nutrient_table_csv_mapping_field_columns_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'nutrient_table_csv_mapping_fields',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          nutrient_table_id: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          field_name: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          column_offset: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('nutrient_table_csv_mapping_fields', {
        fields: ['nutrient_table_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_tables',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'nutrient_table_csv_mapping_fields_nutrient_table_id_fk',
        transaction,
      });

      await queryInterface.addConstraint('nutrient_table_csv_mapping_fields', {
        fields: ['nutrient_table_id', 'field_name'],
        type: 'unique',
        name: 'nutrient_table_csv_mapping_fields_unique',
        transaction,
      });

      await queryInterface.addIndex('nutrient_table_csv_mapping_fields', ['nutrient_table_id'], {
        name: 'nutrient_table_csv_mapping_fields_nutrient_table_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO nutrient_table_csv_mapping_fields (id, nutrient_table_id, field_name, column_offset) SELECT id, nutrient_table_id, field_name, column_offset FROM v3_nutrient_table_csv_mapping_field_columns',
        { transaction },
      );

      await updateSequence('nutrient_table_csv_mapping_fields', 'id', {
        queryInterface,
        transaction,
      });

      await queryInterface.renameTable(
        'nutrient_table_csv_mapping_nutrient_columns',
        'v3_nutrient_table_csv_mapping_nutrient_columns',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_nutrient_table_csv_mapping_nutrient_columns RENAME CONSTRAINT nutrient_table_csv_mapping_columns_pkey TO v3_nutrient_table_csv_mapping_columns_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE nutrient_table_csv_mapping_columns_id_seq RENAME TO v3_nutrient_table_csv_mapping_columns_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'nutrient_table_csv_mapping_nutrients',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          nutrient_table_id: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          nutrient_type_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          column_offset: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('nutrient_table_csv_mapping_nutrients', {
        fields: ['nutrient_table_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_tables',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'nutrient_table_csv_mapping_nutrients_nutrient_table_id_fk',
        transaction,
      });

      await queryInterface.addIndex('nutrient_table_csv_mapping_nutrients', ['nutrient_table_id'], {
        name: 'nutrient_table_csv_mapping_nutrients_nutrient_table_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('nutrient_table_csv_mapping_nutrients', {
        fields: ['nutrient_type_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'nutrient_table_csv_mapping_nutrients_nutrient_type_id_fk',
        transaction,
      });

      await queryInterface.addIndex('nutrient_table_csv_mapping_nutrients', ['nutrient_type_id'], {
        name: 'nutrient_table_csv_mapping_nutrients_nutrient_type_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO nutrient_table_csv_mapping_nutrients (id, nutrient_table_id, nutrient_type_id, column_offset) SELECT id, nutrient_table_id, nutrient_type_id, column_offset FROM v3_nutrient_table_csv_mapping_nutrient_columns',
        { transaction },
      );

      await updateSequence('nutrient_table_csv_mapping_nutrients', 'id', {
        queryInterface,
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
