export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'associated_foods',
        'generic_name',
        { type: Sequelize.TEXT({ length: 'long' }), allowNull: false },
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'text',
        { type: Sequelize.TEXT({ length: 'long' }), allowNull: false },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE associated_foods SET generic_name = concat('{"ar":"', generic_name, '"}'), text = concat('{"ar":"', text, '"}') WHERE locale_id = 'ar_AE';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE associated_foods SET generic_name = concat('{"da":"', generic_name, '"}'), text = concat('{"da":"', text, '"}') WHERE locale_id = 'da_DK';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE associated_foods SET generic_name = concat('{"pt":"', generic_name, '"}'), text = concat('{"pt":"', text, '"}') WHERE locale_id = 'pt_PT';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE associated_foods SET generic_name = concat('{"en":"', generic_name, '"}'), text = concat('{"en":"', text, '"}') WHERE locale_id NOT IN ('ar_AE', 'da_DK', 'pt_PT');`,
        { transaction },
      );

      await queryInterface.addColumn(
        'associated_foods',
        'multiple',
        { allowNull: true, type: Sequelize.BOOLEAN },
        { transaction },
      );

      await queryInterface.sequelize.query(`UPDATE associated_foods SET multiple = false;`, {
        transaction,
      });

      await queryInterface.changeColumn(
        'associated_foods',
        'multiple',
        { allowNull: false, type: Sequelize.BOOLEAN },
        { transaction },
      );
    }),

  down: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('associated_foods', 'multiple', { transaction });

      await queryInterface.sequelize.query(
        `UPDATE associated_foods SET generic_name = substring(generic_name, '{"\\S+":"(.*)"}'), text = substring(text, '{"\\S+":"(.*)"}');`,
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'generic_name',
        { type: Sequelize.STRING(128), allowNull: false },
        { transaction },
      );

      await queryInterface.changeColumn(
        'associated_foods',
        'text',
        { type: Sequelize.STRING(1024), allowNull: false },
        { transaction },
      );
    }),
};
