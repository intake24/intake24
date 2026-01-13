import systemDbConfig from '../../system/config.cjs';

export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'locales',
        'food_index_enabled',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      const { QueryTypes } = queryInterface.sequelize;

      const env = process.env.NODE_ENV;
      const { url, ...config } = systemDbConfig[env];
      const system = url ? new Sequelize(url, systemDbConfig[env]) : new Sequelize(config);

      const locales = await system.query(
        `SELECT l.code FROM locales l JOIN surveys s ON l.id = s.locale_id WHERE s.state = 'active';`,
        { type: QueryTypes.SELECT },
      );

      const codes = locales.map(({ code }) => code);

      await queryInterface.sequelize.query(
        `UPDATE locales SET food_index_enabled = true WHERE id IN (:codes);`,
        {
          type: QueryTypes.UPDATE,
          replacements: { codes },
          transaction,
        },
      );
    }),

  down: async queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('locales', 'food_index_enabled', { transaction });
    }),
};
