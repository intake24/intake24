import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('physical_activity_levels', 'v3_physical_activity_levels', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `ALTER TABLE v3_physical_activity_levels RENAME CONSTRAINT physical_activity_levels_pkey TO v3_physical_activity_levels_pkey;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER SEQUENCE physical_activity_levels_id_seq RENAME TO v3_physical_activity_levels_id_seq;',
        { transaction },
      );

      await queryInterface.createTable(
        'physical_activity_levels',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          coefficient: {
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO physical_activity_levels (id, name, coefficient) SELECT id, name, coefficient FROM v3_physical_activity_levels',
        { transaction },
      );

      await updateSequence('physical_activity_levels', 'id', { queryInterface, transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
