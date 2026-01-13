export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'languages',
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING(16),
          },
          english_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          local_name: {
            allowNull: false,
            type: Sequelize.STRING(512),
            unique: true,
          },
          country_flag_code: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          text_direction: {
            allowNull: false,
            defaultValue: 'ltr',
            type: Sequelize.STRING(16),
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

      await queryInterface.sequelize.query(
        `UPDATE locales SET respondent_language_id = admin_language_id;`,
        { transaction },
      );

      const locales = await queryInterface.sequelize.query(
        `SELECT admin_language_id, country_flag_code FROM locales;`,
        { transaction },
      );

      const languages = locales[0].reduce((acc, locale) => {
        const { admin_language_id, country_flag_code } = locale;

        const match = acc.find(item => item.id === admin_language_id);
        if (match)
          return acc;

        acc.push({
          id: admin_language_id,
          english_name: admin_language_id,
          local_name: admin_language_id,
          country_flag_code,
          created_at,
          updated_at,
        });
        return acc;
      }, []);

      await queryInterface.bulkInsert('languages', languages, { transaction });

      await queryInterface.addConstraint('locales', {
        fields: ['admin_language_id'],
        name: 'locales_admin_language_id_fk',
        type: 'foreign key',
        references: {
          table: 'languages',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });

      await queryInterface.addConstraint('locales', {
        fields: ['respondent_language_id'],
        name: 'locales_respondent_language_id_fk',
        type: 'foreign key',
        references: {
          table: 'languages',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'restrict',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint('locales', 'locales_admin_language_id_fk', {
        transaction,
      });

      await queryInterface.removeConstraint('locales', 'locales_respondent_language_id_fk', {
        transaction,
      });

      await queryInterface.dropTable('languages', { transaction });
    }),
};
