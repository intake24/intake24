/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const { QueryTypes } = queryInterface.sequelize;
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Category inheritance logic:
      //
      // Categories are global (shared across locales) and inherited locales can rely on the parent locale
      // to provide local category data (names, PSMs) and only create local category records when needed as overrides.
      //
      // If locale languages match, then child locales can omit local category data altogether and it is assumed they are the same
      // as in the prototype locale.
      //
      // If languages don't match, then only categories that have rows in category_locals are assumed to exist in the target locale.
      //
      // This function will copy relevant category data from the prototype locale according to these rules:
      //
      // Local names (that is, category_locals rows) will only be copied if the locale languages match.
      //
      // Category PSMs rows are language-independent and will be copied unless some rows already exist in the target locale for the
      // same category code.
      //
      // Attributes are global for categories and AFPs currently can only be defined at the food level.
      async function copyCategoryData(prototypeLocaleId, targetLocaleId, languageCompatible) {
        // Copy local category records: this only makes sense if the languages of the prototype and the inherited
        // locales match.

        if (languageCompatible) {
          await queryInterface.sequelize.query(
            `insert into category_locals(
               category_code,
               locale_id,
               name,
               simple_name,
               version,
               tags
             )
            select
              category_code,
              :targetLocaleId,
              name,
              simple_name,
              uuid_generate_v4() as version,
              tags
            from category_locals
            where locale_id = :prototypeLocaleId
            on conflict (category_code, locale_id) do nothing;`,
            {
              type: QueryTypes.INSERT,
              replacements: {
                targetLocaleId,
                prototypeLocaleId,
              },
              transaction,
            },
          );
        }

        // Copy portion size methods (these are language-independent).
        // Only copy if no portion size method rows exist for the same category code in target locale (otherwise keep existing rows as override)
        await queryInterface.sequelize.query(
          `with source_target_map as (
            select 
                cl_source.id as source_local_id,
                cl_target.id as target_local_id,
                cl_source.category_code
            from category_locals cl_source
            join category_locals cl_target 
                on cl_target.category_code = cl_source.category_code
            left join category_portion_size_methods psm_target 
                on psm_target.category_local_id = cl_target.id
            where cl_source.locale_id = :prototypeLocaleId
            and cl_target.locale_id = :targetLocaleId
            and psm_target.category_local_id is null
          )
          insert into category_portion_size_methods (
            category_local_id, 
            method, 
            description, 
            use_for_recipes, 
            conversion_factor, 
            order_by, 
            parameters
          )
          select 
            stm.target_local_id,
            psm.method,
            psm.description,
            psm.use_for_recipes,
            psm.conversion_factor,
            psm.order_by,
            psm.parameters
          from category_portion_size_methods psm
          join source_target_map stm
              on psm.category_local_id = stm.source_local_id;`,
          { replacements: { prototypeLocaleId, targetLocaleId }, transaction },
        );
      }

      // Food inheritance logic:
      //
      // foods_local_lists is the authoritative source for determining if a food is included in the target locale.
      //
      // However, some legacy rows may exist in food_locals from an older approach, where inclusion was indicated by
      // the existence of a row, but names could be null, meaning they should be inherited from the prototype
      // locale.
      //
      // To ensure foods_local_lists is the single source of truth, this function will do the following:
      //
      // 1. Drop all food_locals rows where codes are not in foods_local_lists and name or simple_name is null
      //
      // 2. If locale languages match, then for all food codes in foods_local_lists for the target locale,
      //    copy the corresponding food_locals row from the prototype locale. If a row already exists,
      //    copy nullable fields (name, simple_name) instead.
      //
      // Then it will:
      //
      // 3. Copy food PSM rows unless some rows already exist in the target locale for the same food code.
      // 4. If locale languages match, copy AFPs rows unless rows already exist in the target locale for the same food code.
      async function copyFoodData(prototypeLocaleId, targetLocaleId, languageCompatible) {
        // Copy names and other food_locals fields if missing
        if (languageCompatible) {
          await queryInterface.sequelize.query(
            `insert into food_locals (food_code, locale_id, name, simple_name, version, alt_names, tags)
             select
               fl_source.food_code,
               :targetLocaleId as locale_id,
               fl_source.name,
               fl_source.simple_name,
               uuid_generate_v4() as version,
               fl_source.alt_names,
               fl_source.tags
             from food_locals fl_source
             where fl_source.locale_id = :prototypeLocaleId
             and fl_source.name is not null
             on conflict (food_code, locale_id)
             do update set
               name = coalesce(food_locals.name, excluded.name),
               simple_name = coalesce(food_locals.simple_name, excluded.simple_name),
               alt_names = coalesce(food_locals.alt_names, excluded.alt_names),
               tags = coalesce(food_locals.tags, excluded.tags),
               version = uuid_generate_v4()`,
            {
              type: QueryTypes.INSERT,
              replacements: { prototypeLocaleId, targetLocaleId },
              transaction,
            },
          );
        }

        // Clean up legacy food_locals rows that conflict with foods_local_lists
        await queryInterface.sequelize.query(
          `delete from food_locals fl
           where fl.locale_id = :targetLocaleId
           and not exists (
             select 1
             from foods_local_lists fll
             where fll.locale_id = fl.locale_id
             and fll.food_code = fl.food_code
           ) 
           and (fl.name is null or fl.simple_name is null)`,
          {
            type: QueryTypes.DELETE,
            replacements: { targetLocaleId },
            transaction,
          },
        );

        // Copy portion size methods (these are language-independent).
        // Only copy if no portion size method rows exist for the same food code in target locale (otherwise keep existing rows as override)
        await queryInterface.sequelize.query(
          `with source_target_map as (
            select 
                fl_source.id as source_local_id,
                fl_target.id as target_local_id,
                fl_source.food_code
            from food_locals fl_source
            join food_locals fl_target 
                on fl_target.food_code = fl_source.food_code
            left join food_portion_size_methods psm_target 
                on psm_target.food_local_id = fl_target.id
            where fl_source.locale_id = :prototypeLocaleId
            and fl_target.locale_id = :targetLocaleId
            and psm_target.food_local_id is null
          )
          insert into food_portion_size_methods (
            food_local_id, 
            method, 
            description, 
            use_for_recipes, 
            conversion_factor, 
            order_by, 
            parameters
          )
          select 
            stm.target_local_id,
            psm.method,
            psm.description,
            psm.use_for_recipes,
            psm.conversion_factor,
            psm.order_by,
            psm.parameters
          from food_portion_size_methods psm
          join source_target_map stm
              on psm.food_local_id = stm.source_local_id;`,
          { replacements: { prototypeLocaleId, targetLocaleId }, transaction },
        );

        // Copy AFPs
        if (languageCompatible) {
          await queryInterface.sequelize.query(
            `insert into associated_foods(
             food_code, 
             locale_id, 
             associated_food_code,
             associated_category_code, 
             text,
             link_as_main,
             generic_name,
             order_by,
             multiple
          )
          select 
            af.food_code, 
            :targetLocaleId as locale_id, 
            af.associated_food_code,
            af.associated_category_code, 
            af.text,
            af.link_as_main,
            af.generic_name,
            af.order_by,
            af.multiple
          from associated_foods af
          where af.locale_id = :prototypeLocaleId
          and not exists (select 1 from associated_foods af_check where af_check.food_code = af.food_code and af_check.locale_id = :targetLocaleId);`,
            { replacements: { prototypeLocaleId, targetLocaleId }, transaction },
          );
        }
      }

      const inheritedLocales = await queryInterface.sequelize.query(
        `select 
          l.id as locale_id,
          l.prototype_locale_id as prototype_locale_id, 
          substring(l.respondent_language_id from 1 for 2) = substring(pl.respondent_language_id from 1 for 2) as prototype_language_compatible
        from locales l left join locales pl on pl.id = l.prototype_locale_id where l.prototype_locale_id is not null;`,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const relevantLocales = new Set();

      for (const inheritedLocale of inheritedLocales) {
        relevantLocales.add(inheritedLocale.locale_id);
        relevantLocales.add(inheritedLocale.prototype_locale_id);
      }

      for (const { locale_id: targetLocaleId, prototype_locale_id: prototypeLocaleId, prototype_language_compatible: languageCompatible } of inheritedLocales) {
        console.debug(`Copying data from prototype locale ${prototypeLocaleId} into ${targetLocaleId}`);
        await copyCategoryData(prototypeLocaleId, targetLocaleId, languageCompatible);
        await copyFoodData(prototypeLocaleId, targetLocaleId, languageCompatible);
      }

      await queryInterface.removeColumn('locales', 'prototype_locale_id', { transaction });
    });
  },

  async down() {
    throw new Error('This migration cannot be undone');
  },
};
