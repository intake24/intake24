/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('standard_units', 'old_standard_units', { transaction });
      await queryInterface.sequelize.query(`ALTER INDEX standard_units_name_idx RENAME TO old_standard_units_name_idx;`, { transaction });

      await queryInterface.createTable(
        'standard_units',
        {
          id: {
            type: Sequelize.DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          code: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
          locale_id: {
            allowNull: false,
            type: Sequelize.STRING(64),
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          icon: {
            allowNull: true,
            type: Sequelize.STRING(128),
          },
          estimate_in: {
            allowNull: false,
            type: Sequelize.JSONB,
          },
          how_many: {
            allowNull: false,
            type: Sequelize.JSONB,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('standard_units', {
        fields: ['code', 'locale_id'],
        type: 'unique',
        name: 'standard_units_unique',
        transaction,
      });

      await queryInterface.addConstraint('standard_units', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'standard_units_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('standard_units', ['locale_id'], {
        name: 'standard_units_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('standard_units', ['name'], {
        name: 'standard_units_name_idx',
        indexType: 'btree',
        transaction,
      });

      const languages = await queryInterface.sequelize.query(
        `SELECT distinct jsonb_object_keys(estimate_in) as id FROM old_standard_units
        union all
        SELECT distinct jsonb_object_keys(how_many) as id FROM old_standard_units`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      const langs = [...languages.reduce((acc, { id }) => {
        acc.add(id);

        const item = id.split('-').at(0);

        if (item)
          acc.add(item);

        return acc;
      }, new Set())];

      const locales = await queryInterface.sequelize.query(
        `SELECT id, respondent_language_id FROM locales;`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const locale of locales) {
        const localeLangs = [...new Set(['en', locale.respondent_language_id, locale.respondent_language_id.split('-').at(0)])];
        const remove = langs.filter(l => !localeLangs.includes(l));

        await queryInterface.sequelize.query(
          `INSERT INTO standard_units (code, locale_id, name, icon, estimate_in, how_many)
          SELECT id, :localeId, name, icon, estimate_in - ARRAY[:remove], how_many - ARRAY[:remove] FROM old_standard_units;`,
          {
            type: Sequelize.QueryTypes.INSERT,
            replacements: {
              localeId: locale.id,
              remove,
            },
            transaction,
          },
        );
      }

      await queryInterface.dropTable('old_standard_units', { transaction });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
