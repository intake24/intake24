import { updateSequence } from '../../utils.js';

export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable(
        'food_portion_size_method_params',
        'v3_food_portion_size_method_params',
        { transaction },
      );

      await queryInterface.createTable(
        'food_portion_size_method_params',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          portion_size_method_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(32),
            allowNull: false,
          },
          value: {
            type: Sequelize.STRING(128),
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('food_portion_size_method_params', {
        fields: ['portion_size_method_id'],
        type: 'foreign key',
        references: {
          table: 'food_portion_size_methods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'foods_portion_size_method_params_portion_size_method_id_fk',
        transaction,
      });

      await queryInterface.addIndex('food_portion_size_method_params', ['portion_size_method_id'], {
        name: 'foods_portion_size_method_params_portion_size_method_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO food_portion_size_method_params (id, portion_size_method_id, "name", value) SELECT id, portion_size_method_id, "name", value FROM v3_food_portion_size_method_params',
        { transaction },
      );

      await updateSequence('food_portion_size_method_params', 'id', {
        queryInterface,
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
