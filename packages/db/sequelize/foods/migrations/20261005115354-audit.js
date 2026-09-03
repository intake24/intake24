/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'audit_tables',
        {
          id: {
            type: Sequelize.TEXT,
            primaryKey: true,
          },
          exclude: {
            type: Sequelize.ARRAY(Sequelize.TEXT),
            allowNull: false,
            defaultValue: [],
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'audit_log',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.literal('uuidv7()'),
          },
          table_name: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          record_id: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          operation: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          changed_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          ctx_type: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          ctx_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          ctx_user_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          old_value: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          new_value: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('audit_log', ['table_name'], {
        name: 'audit_log_table_name_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('audit_log', ['record_id'], {
        name: 'audit_log_record_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('audit_log', ['operation'], {
        name: 'audit_log_operation_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('audit_log', ['ctx_type'], {
        name: 'audit_log_ctx_type_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('audit_log', ['ctx_id'], {
        name: 'audit_log_ctx_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('audit_log', ['ctx_user_id'], {
        name: 'audit_log_ctx_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('audit_log', {
        fields: [{ name: 'old_value', operator: 'jsonb_path_ops' }],
        using: 'GIN',
        name: 'audit_log_old_value_gin',
        transaction,
      });

      await queryInterface.addIndex('audit_log', {
        fields: [{ name: 'new_value', operator: 'jsonb_path_ops' }],
        using: 'GIN',
        name: 'audit_log_new_value_gin',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('audit_log', { transaction });
      await queryInterface.dropTable('audit_tables', { transaction });
    }),
};
