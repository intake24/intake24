export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `update permissions set "name" = replace("name", '-list', '-browse'), display_name = replace(display_name, 'List', 'Browse')
          where "name" like '%-list';`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `update permissions set display_name = replace(display_name, 'Browse', 'Read') where "name" like '%-detail';`,
        { transaction },
      );
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `update permissions set "name" = replace("name", '-browse', '-list'), display_name = replace(display_name, 'Browse', 'List')
          where "name" like '%-browse';`,
        { transaction },
      );
    }),
};
