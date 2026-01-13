export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'personal_access_tokens',
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
          name: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          token: {
            allowNull: false,
            type: Sequelize.STRING(64),
            unique: true,
          },
          scopes: {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          revoked: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          used_at: {
            allowNull: true,
            type: Sequelize.DATE,
          },
          expires_at: {
            allowNull: true,
            type: Sequelize.DATE,
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

      await queryInterface.addConstraint('personal_access_tokens', {
        fields: ['user_id'],
        name: 'personal_access_tokens_user_id_fk',
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('personal_access_tokens', ['user_id'], {
        name: 'personal_access_tokens_user_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('personal_access_tokens', { transaction });
    }),
};
