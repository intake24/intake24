export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'user_survey_ratings',
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
          survey_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          type: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          submission_id: {
            allowNull: true,
            type: Sequelize.UUID,
          },
          rating: {
            allowNull: false,
            type: Sequelize.SMALLINT,
          },
          comment: {
            allowNull: true,
            type: Sequelize.TEXT(512),
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

      await queryInterface.addConstraint('user_survey_ratings', {
        fields: ['user_id'],
        name: 'user_survey_ratings_user_id_fk',
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('user_survey_ratings', ['user_id'], {
        name: 'user_survey_ratings_user_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('user_survey_ratings', {
        fields: ['survey_id'],
        name: 'user_survey_ratings_survey_id_fk',
        type: 'foreign key',
        references: {
          table: 'surveys',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('user_survey_ratings', ['survey_id'], {
        name: 'user_survey_ratings_survey_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('user_survey_ratings', {
        fields: ['submission_id'],
        name: 'user_survey_ratings_submission_id_fk',
        type: 'foreign key',
        references: {
          table: 'survey_submissions',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        transaction,
      });

      await queryInterface.addIndex('user_survey_ratings', ['submission_id'], {
        name: 'user_survey_ratings_submission_id_idx',
        indexType: 'btree',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('user_survey_ratings', { transaction });
    }),
};
