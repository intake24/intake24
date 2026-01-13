/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'session',
        {
          allowNull: true,
          type: Sequelize.TEXT({ length: 'long' }),
        },
        { transaction },
      );

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, session_lifetime, store_user_session_on_server FROM surveys;`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const survey of surveys) {
        const { id, session_lifetime, store_user_session_on_server } = survey;

        const session = {
          store: store_user_session_on_server ?? true,
          age: session_lifetime ?? '12h',
          fixed: '1d+0h',
        };

        await queryInterface.sequelize.query(
          `UPDATE surveys SET session = :session WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, session: JSON.stringify(session) },
            transaction,
          },
        );
      }

      await queryInterface.removeColumn('surveys', 'session_lifetime', { transaction });
      await queryInterface.removeColumn('surveys', 'store_user_session_on_server', { transaction });
    }),

  down: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'surveys',
        'session_lifetime',
        {
          allowNull: false,
          type: Sequelize.STRING(32),
          defaultValue: '12h',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'surveys',
        'store_user_session_on_server',
        {
          allowNull: true,
          type: Sequelize.BOOLEAN,
        },
        { transaction },
      );

      const surveys = await queryInterface.sequelize.query(
        `SELECT id, session FROM surveys;`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const survey of surveys) {
        const { id } = survey;

        const session = JSON.parse(survey.session);

        await queryInterface.sequelize.query(
          `UPDATE surveys SET session_lifetime = :age, store_user_session_on_server = :store WHERE id = :id;`,
          {
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            replacements: { id, age: session.age ?? '12h', store: session.store ?? true },
            transaction,
          },
        );
      }

      await queryInterface.changeColumn(
        'surveys',
        'store_user_session_on_server',
        {
          allowNull: false,
          type: Sequelize.BOOLEAN,
        },
        { transaction },
      );

      await queryInterface.removeColumn('surveys', 'session', { transaction });
    }),
};
