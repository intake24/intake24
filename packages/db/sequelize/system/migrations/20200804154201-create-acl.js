export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'users',
        'created_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'roles',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(128),
            unique: true,
          },
          display_name: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          description: {
            allowNull: true,
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

      await queryInterface.createTable('permissions', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT,
        },
        name: {
          allowNull: false,
          type: Sequelize.STRING(128),
          unique: true,
        },
        display_name: {
          allowNull: false,
          type: Sequelize.STRING(128),
        },
        description: {
          allowNull: true,
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
      });

      await queryInterface.createTable(
        'permission_role',
        {
          permission_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          role_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
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

      await queryInterface.addConstraint('permission_role', {
        fields: ['permission_id', 'role_id'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('permission_role', {
        fields: ['permission_id'],
        type: 'foreign key',
        references: {
          table: 'permissions',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('permission_role', {
        fields: ['role_id'],
        type: 'foreign key',
        references: {
          table: 'roles',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.createTable(
        'permission_user',
        {
          permission_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
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

      await queryInterface.addConstraint('permission_user', {
        fields: ['permission_id', 'user_id'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('permission_user', {
        fields: ['permission_id'],
        type: 'foreign key',
        references: {
          table: 'permissions',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('permission_user', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.createTable(
        'role_user',
        {
          role_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
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

      await queryInterface.addConstraint('role_user', {
        fields: ['role_id', 'user_id'],
        type: 'primary key',
        transaction,
      });

      await queryInterface.addConstraint('role_user', {
        fields: ['role_id'],
        type: 'foreign key',
        references: {
          table: 'roles',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('role_user', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('users', 'created_at', { transaction });
      await queryInterface.removeColumn('users', 'updated_at', { transaction });
      await queryInterface.dropTable('permission_role', { transaction });
      await queryInterface.dropTable('permission_user', { transaction });
      await queryInterface.dropTable('role_user', { transaction });
      await queryInterface.dropTable('roles', { transaction });
      await queryInterface.dropTable('permissions', { transaction });
    });
  },
};
