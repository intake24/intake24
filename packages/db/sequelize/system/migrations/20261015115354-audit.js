/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      const exists = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'pg_catalog'
            AND p.proname = 'uuidv7'
        ) AS exists;`, { transaction });

      if (!exists[0][0].exists) {
        await queryInterface.sequelize.query(`
          create or replace function uuidv7()
          returns uuid
          as $$
            -- use random v4 uuid as starting point (which has the same variant we need)
            -- then overlay timestamp
            -- then set version 7 by flipping the 2 and 1 bit in the version 4 string
          select encode(
              set_bit(
                set_bit(
                  overlay(uuid_send(gen_random_uuid())
                          placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
                          from 1 for 6
                  ),
                  52, 1
                ),
                53, 1
              ),
              'hex')::uuid;
          $$
          language SQL
          volatile;`, { transaction });
      }

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
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
