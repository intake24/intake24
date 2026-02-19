/** @type {import('sequelize-cli').Migration} */
export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE category_portion_size_methods cpsm set pathways = array_append(pathways, 'recipe')
        where not cpsm.pathways::text[] @> array['recipe'] and cpsm.category_id in (
          WITH RECURSIVE cats AS (
            select 0::bigint as category_id, c.id as sub_category_id
            from categories c
            WHERE
            c.id in (select rfc.id FROM recipe_foods_steps rfs join categories rfc on rfs.category_code = rfc.code and rfs.locale_id = rfc.locale_id)
            UNION
            select cc2.category_id, cc2.sub_category_id
            from categories_categories cc2
            JOIN categories c2 on cc2.sub_category_id = c2.id
            INNER JOIN cats ON cc2.category_id = cats.sub_category_id
          )
          SELECT distinct sub_category_id FROM cats
        )
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE food_portion_size_methods fpsm set pathways = array_append(pathways, 'recipe')
        where not fpsm.pathways::text[] @> array['recipe'] and fpsm.food_id in (
          WITH RECURSIVE cats AS (
            select 0::bigint as category_id, c.id as sub_category_id
            from categories c
            WHERE
            c.id in (select rfc.id FROM recipe_foods_steps rfs join categories rfc on rfs.category_code = rfc.code and rfs.locale_id = rfc.locale_id)
            UNION
            select cc2.category_id, cc2.sub_category_id
            from categories_categories cc2
            JOIN categories c2 on cc2.sub_category_id = c2.id
            INNER JOIN cats ON cc2.category_id = cats.sub_category_id
          )
          SELECT distinct fc.food_id FROM cats
          join foods_categories fc on cats.sub_category_id = fc.category_id
          )
        `,
        { transaction },
      );
    }),

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
