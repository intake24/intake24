export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'refresh_tokens',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING(128),
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          revoked: {
            allowNull: false,
            defaultValue: false,
            type: Sequelize.BOOLEAN,
          },
          expires_at: {
            allowNull: false,
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

      await queryInterface.addConstraint('refresh_tokens', {
        fields: ['user_id'],
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'no action',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('refresh_tokens', { transaction });
    }),
};
