export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'survey_schemes',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(256),
            unique: true,
          },
          type: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
          questions: {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          meals: {
            allowNull: true,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          data_export: {
            allowNull: true,
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
          old_scheme_id: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'surveys',
        'survey_scheme_id',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addConstraint('surveys', {
        fields: ['survey_scheme_id'],
        type: 'foreign key',
        references: {
          table: 'survey_schemes',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        name: 'surveys_survey_scheme_id_fk',
        transaction,
      });

      await queryInterface.addIndex('surveys', ['survey_scheme_id'], {
        name: 'surveys_survey_scheme_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO survey_schemes (name, type, questions, meals, data_export, created_at, updated_at, old_scheme_id) SELECT name, 'default', questions, meals, export, created_at, updated_at, id FROM schemes;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE surveys SET survey_scheme_id = ss.id FROM survey_schemes ss WHERE scheme_id = ss.old_scheme_id`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'surveys',
        'survey_scheme_id',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeColumn('survey_schemes', 'old_scheme_id', { transaction });

      await queryInterface.renameTable('schemes', 'v4dep_schemes', { transaction });

      await queryInterface.renameTable('scheme_questions', 'survey_scheme_questions', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = replace("name", 'schemes|', 'survey-schemes|') where "name" like 'schemes|%';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = replace("name", 'scheme-questions|', 'survey-scheme-questions|') where "name" like 'scheme-questions|%';`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = replace("name", 'survey-schemes|', 'schemes|') where "name" like 'survey-schemes|%';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE permissions SET "name" = replace("name", 'survey-scheme-questions|', 'scheme-questions|') where "name" like 'survey-scheme-questions|%';`,
        { transaction },
      );

      await queryInterface.renameTable('survey_scheme_questions', 'scheme_questions', {
        transaction,
      });

      await queryInterface.renameTable('v4dep_schemes', 'schemes', { transaction });

      await queryInterface.removeColumn('surveys', 'survey_scheme_id', { transaction });

      await queryInterface.dropTable('survey_schemes', { transaction });
    }),
};
