import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('demographic_group', 'v3_demographic_group', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_demographic_group RENAME CONSTRAINT demographic_group_pkey TO v3_demographic_group_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE demographic_group_id_seq RENAME TO v3_demographic_group_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'demographic_groups',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          min_age: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          max_age: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          min_height: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },
          max_height: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },
          min_weight: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },
          max_weight: {
            type: Sequelize.DOUBLE,
            allowNull: true,
          },
          sex: {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          physical_activity_level_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          nutrient_type_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          nutrient_rule_type: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('demographic_groups', {
        fields: ['physical_activity_level_id'],
        type: 'foreign key',
        references: {
          table: 'physical_activity_levels',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'demographic_groups_physical_activity_level_id_fk',
        transaction,
      });

      await queryInterface.addIndex('demographic_groups', ['physical_activity_level_id'], {
        name: 'demographic_groups_physical_activity_level_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('demographic_groups', {
        fields: ['nutrient_type_id'],
        type: 'foreign key',
        references: {
          table: 'nutrient_types',
          field: 'id',
        },
        onUpdate: 'no action',
        onDelete: 'no action',
        name: 'demographic_groups_nutrient_type_id_fk',
        transaction,
      });

      await queryInterface.addIndex('demographic_groups', ['nutrient_type_id'], {
        name: 'demographic_groups_nutrient_type_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO demographic_groups (id, min_age, max_age, min_height, max_height, min_weight, max_weight, sex, physical_activity_level_id, nutrient_type_id, nutrient_rule_type) SELECT id, lower(age), upper(age), lower(height), upper(height), lower(weight), upper(weight), sex, physical_activity_level_id, nutrient_type_id, nutrient_rule_type FROM v3_demographic_group',
        { transaction },
      );

      await updateSequence('demographic_groups', 'id', { queryInterface, transaction });

      await queryInterface.renameTable(
        'demographic_group_scale_sector',
        'v3_demographic_group_scale_sector',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_demographic_group_scale_sector RENAME CONSTRAINT demographic_group_scale_sector_pkey TO v3_demographic_group_scale_sector_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE demographic_group_scale_sector_id_seq RENAME TO v3_demographic_group_scale_sector_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'demographic_group_scale_sectors',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          demographic_group_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT({ length: 'long' }),
            allowNull: true,
          },
          sentiment: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          min_range: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          max_range: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('demographic_group_scale_sectors', {
        fields: ['demographic_group_id'],
        type: 'foreign key',
        references: {
          table: 'demographic_groups',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'demographic_group_scale_sectors_demographic_group_id_fk',
        transaction,
      });

      await queryInterface.addIndex('demographic_group_scale_sectors', ['demographic_group_id'], {
        name: 'demographic_group_scale_sectors_demographic_group_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO demographic_group_scale_sectors (id, demographic_group_id, name, description, sentiment, min_range, max_range) SELECT id, demographic_group_id, name, description, sentiment, lower(range), upper(range) FROM v3_demographic_group_scale_sector',
        { transaction },
      );

      await updateSequence('demographic_group_scale_sectors', 'id', {
        queryInterface,
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
