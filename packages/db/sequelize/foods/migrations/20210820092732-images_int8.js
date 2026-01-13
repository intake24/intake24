import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('source_images', 'v3_source_images', { transaction });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE source_images_id_seq RENAME TO v3_source_images_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'source_images',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          path: {
            type: Sequelize.STRING(1024),
            allowNull: false,
          },
          thumbnail_path: {
            type: Sequelize.STRING(1024),
            allowNull: false,
          },
          uploader: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          uploaded_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('source_images', ['path'], {
        name: 'source_images_path_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO source_images (id, path, thumbnail_path, uploader, uploaded_at) SELECT id, path, thumbnail_path, uploader, uploaded_at FROM v3_source_images',
        { transaction },
      );

      await updateSequence('source_images', 'id', { queryInterface, transaction });

      await queryInterface.changeColumn(
        'source_image_keywords',
        'source_image_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint(
        'source_image_keywords',
        'source_image_keywords_source_image_id_fk',
        { transaction },
      );

      await queryInterface.addConstraint('source_image_keywords', {
        fields: ['source_image_id'],
        type: 'foreign key',
        references: {
          table: 'source_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'source_image_keywords_source_image_id_fk',
        transaction,
      });

      await queryInterface.renameTable('processed_images', 'v3_processed_images', { transaction });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE processed_images_id_seq RENAME TO v3_processed_images_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'processed_images',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          source_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          path: {
            type: Sequelize.STRING(1024),
            allowNull: false,
          },
          purpose: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO processed_images (id, source_id, path, purpose, created_at) SELECT id, source_id, path, purpose, created_at FROM v3_processed_images',
        { transaction },
      );

      await updateSequence('processed_images', 'id', { queryInterface, transaction });

      await queryInterface.changeColumn(
        'image_maps',
        'base_image_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint('image_maps', 'image_maps_base_image_id_fkey', {
        transaction,
      });

      await queryInterface.addConstraint('image_maps', {
        fields: ['base_image_id'],
        type: 'foreign key',
        references: {
          table: 'processed_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'image_maps_base_image_id_fk',
        transaction,
      });

      await queryInterface.addIndex('image_maps', ['base_image_id'], {
        name: 'image_maps_base_image_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.renameTable('image_map_objects', 'v3_image_map_objects', {
        transaction,
      });

      await queryInterface.createTable(
        'image_map_objects',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
          },
          image_map_id: {
            type: Sequelize.STRING(32),
            primaryKey: true,
          },
          description: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          navigation_index: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          outline_coordinates: {
            type: Sequelize.ARRAY(Sequelize.DOUBLE),
            allowNull: false,
          },
          overlay_image_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('image_map_objects', {
        fields: ['image_map_id'],
        type: 'foreign key',
        references: {
          table: 'image_maps',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'image_map_objects_image_map_id_fk',
        transaction,
      });

      await queryInterface.addIndex('image_map_objects', ['image_map_id'], {
        name: 'image_map_objects_image_map_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO image_map_objects (id, image_map_id, description, navigation_index, outline_coordinates, overlay_image_id) SELECT id, image_map_id, description, navigation_index, outline_coordinates, overlay_image_id FROM v3_image_map_objects',
        { transaction },
      );

      await queryInterface.changeColumn(
        'guide_images',
        'selection_image_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint('guide_images', 'guide_selection_image_id_fk', {
        transaction,
      });

      await queryInterface.addConstraint('guide_images', {
        fields: ['selection_image_id'],
        type: 'foreign key',
        references: {
          table: 'processed_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'guide_images_selection_image_id_fk',
        transaction,
      });

      await queryInterface.removeConstraint('guide_images', 'guide_image_image_map_fk', {
        transaction,
      });

      await queryInterface.addConstraint('guide_images', {
        fields: ['image_map_id'],
        type: 'foreign key',
        references: {
          table: 'image_maps',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'guide_images_image_map_id_fk',
        transaction,
      });

      await queryInterface.addIndex('guide_images', ['selection_image_id'], {
        name: 'guide_images_selection_image_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.renameTable('guide_image_objects', 'v3_guide_image_objects', {
        transaction,
      });

      await queryInterface.createTable(
        'guide_image_objects',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          guide_image_id: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          weight: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          image_map_object_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('guide_image_objects', {
        fields: ['guide_image_id'],
        type: 'foreign key',
        references: {
          table: 'guide_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'guide_image_objects_guide_image_id_fk',
        transaction,
      });

      await queryInterface.addIndex('guide_image_objects', ['guide_image_id'], {
        name: 'guide_image_objects_guide_image_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO guide_image_objects (id, guide_image_id, weight, image_map_object_id) SELECT id, guide_image_id, weight, image_map_object_id FROM v3_guide_image_objects',
        { transaction },
      );

      await updateSequence('guide_image_objects', 'id', { queryInterface, transaction });

      await queryInterface.changeColumn(
        'as_served_sets',
        'selection_image_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint('as_served_sets', 'as_served_sets_selection_image_fk', {
        transaction,
      });

      await queryInterface.addConstraint('as_served_sets', {
        fields: ['selection_image_id'],
        type: 'foreign key',
        references: {
          table: 'processed_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'as_served_sets_selection_image_id_fk',
        transaction,
      });

      await queryInterface.addIndex('as_served_sets', ['selection_image_id'], {
        name: 'as_served_sets_selection_image_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.renameTable('as_served_images', 'v3_as_served_images', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE as_served_images_id_seq RENAME TO v3_as_served_images_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'as_served_images',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          as_served_set_id: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          weight: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          image_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          thumbnail_image_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('as_served_images', {
        fields: ['as_served_set_id'],
        type: 'foreign key',
        references: {
          table: 'as_served_sets',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'as_served_images_as_served_set_id_fk',
        transaction,
      });

      await queryInterface.addIndex('as_served_images', ['as_served_set_id'], {
        name: 'as_served_images_as_served_set_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('as_served_images', {
        fields: ['image_id'],
        type: 'foreign key',
        references: {
          table: 'processed_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'as_served_images_image_id_fk',
        transaction,
      });

      await queryInterface.addIndex('as_served_images', ['image_id'], {
        name: 'as_served_images_image_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('as_served_images', {
        fields: ['thumbnail_image_id'],
        type: 'foreign key',
        references: {
          table: 'processed_images',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'as_served_images_thumbnail_image_id_fk',
        transaction,
      });

      await queryInterface.addIndex('as_served_images', ['thumbnail_image_id'], {
        name: 'as_served_images_thumbnail_image_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO as_served_images (id, as_served_set_id, weight, image_id, thumbnail_image_id) SELECT id, as_served_set_id, weight, image_id, thumbnail_image_id FROM v3_as_served_images',
        { transaction },
      );

      await updateSequence('as_served_images', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
