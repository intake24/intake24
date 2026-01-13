export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('user_sessions', 'v3_user_sessions', { transaction });

      await queryInterface.createTable(
        'user_sessions',
        {
          user_id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          survey_id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING(64),
          },
          session_data: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
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

      await queryInterface.addConstraint('user_sessions', {
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

      await queryInterface.addConstraint('user_sessions', {
        fields: ['survey_id'],
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.sequelize.query(
        'INSERT INTO user_sessions (user_id, survey_id, session_data, created_at, updated_at) SELECT user_id, survey_id, session_data, created, created FROM v3_user_sessions',
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('user_sessions', { transaction });
      await queryInterface.renameTable('v3_user_sessions', 'user_sessions', { transaction });
    }),
};
