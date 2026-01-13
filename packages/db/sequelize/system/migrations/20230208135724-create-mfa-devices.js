export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'mfa_devices',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          provider: {
            allowNull: false,
            type: Sequelize.STRING(32),
          },
          secret: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          preferred: {
            allowNull: false,
            defaultValue: false,
            type: Sequelize.BOOLEAN,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('mfa_devices', {
        fields: ['user_id'],
        name: 'mfa_devices_user_id_fk',
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('mfa_devices', ['user_id'], {
        name: 'mfa_devices_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.createTable(
        'mfa_authenticators',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING(512),
          },
          device_id: {
            allowNull: false,
            unique: true,
            type: Sequelize.BIGINT,
          },
          public_key: {
            allowNull: false,
            type: Sequelize.BLOB({ length: 'long' }),
          },
          counter: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          device_type: {
            allowNull: false,
            type: Sequelize.STRING(32),
          },
          backed_up: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
          },
          transports: {
            allowNull: false,
            type: Sequelize.TEXT,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('mfa_authenticators', {
        fields: ['device_id'],
        name: 'mfa_authenticators_device_id_fk',
        type: 'foreign key',
        references: {
          table: 'mfa_devices',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('mfa_authenticators', ['device_id'], {
        name: 'mfa_authenticators_device_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('mfa_authenticators', { transaction });
      await queryInterface.dropTable('mfa_devices', { transaction });
    }),
};
