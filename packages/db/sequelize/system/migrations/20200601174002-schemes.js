export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'schemes',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING(64),
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(128),
            unique: true,
          },
          type: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
          questions: {
            type: Sequelize.TEXT({ length: 'long' }),
          },
          meals: {
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

      const created_at = new Date();
      const updated_at = created_at;

      await queryInterface.bulkInsert(
        'schemes',
        [
          {
            id: 'default',
            name: 'Default',
            type: 'data-driven',
            questions: null,
            meals: null,
            created_at,
            updated_at,
          },
        ],
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE surveys SET scheme_id = 'default'`, {
        transaction,
      });

      await queryInterface.addConstraint('surveys', {
        fields: ['scheme_id'],
        name: 'surveys_scheme_id_schemes_fk',
        type: 'foreign key',
        references: {
          table: 'schemes',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('surveys', 'surveys_scheme_id_schemes_fk', {
        transaction,
      });

      await queryInterface.dropTable('schemes', { transaction });
    }),
};
