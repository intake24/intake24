import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('drinkware_scales', 'v3_drinkware_scales', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE drinkware_scales_id_seq RENAME TO v3_drinkware_scales_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'drinkware_scales',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          drinkware_set_id: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          width: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          height: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          empty_level: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          full_level: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          choice_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          base_image_url: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          overlay_image_url: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('drinkware_scales', {
        fields: ['drinkware_set_id'],
        type: 'foreign key',
        references: {
          table: 'drinkware_sets',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'drinkware_scales_drinkware_set_id_fk',
        transaction,
      });

      await queryInterface.addIndex('drinkware_scales', ['drinkware_set_id'], {
        name: 'drinkware_scales_drinkware_set_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO drinkware_scales (id, drinkware_set_id, width, height, empty_level, full_level, choice_id, base_image_url, overlay_image_url) SELECT id, drinkware_set_id, width, height, empty_level, full_level, choice_id, base_image_url, overlay_image_url FROM v3_drinkware_scales',
        { transaction },
      );

      await updateSequence('drinkware_scales', 'id', { queryInterface, transaction });

      await queryInterface.renameTable('drinkware_volume_samples', 'v3_drinkware_volume_samples', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE drinkware_volume_samples_id_seq RENAME TO v3_drinkware_volume_samples_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'drinkware_volume_samples',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          drinkware_scale_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          fill: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          volume: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('drinkware_volume_samples', {
        fields: ['drinkware_scale_id'],
        type: 'foreign key',
        references: {
          table: 'drinkware_scales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'drinkware_volume_samples_drinkware_scale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('drinkware_volume_samples', ['drinkware_scale_id'], {
        name: 'drinkware_volume_samples_drinkware_scale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO drinkware_volume_samples (id, drinkware_scale_id, fill, volume) SELECT id, drinkware_scale_id, fill, volume FROM v3_drinkware_volume_samples',
        { transaction },
      );

      await updateSequence('drinkware_volume_samples', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
