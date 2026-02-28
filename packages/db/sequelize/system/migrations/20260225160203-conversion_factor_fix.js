import { cloneDeep, get, isEqual, set } from 'lodash-es';

function mapFoods(path, parentId) {
  return (acc, food, idx) => {
    const { id, type } = food;
    if (type === 'free-text')
      return acc;

    const index = Object.keys(acc).length;
    acc[index] = { ...food, parentId, index, path: `${path}[${idx}]` };

    if (food.linkedFoods.length)
      food.linkedFoods.reduce(mapFoods(`${path}[${idx}].linkedFoods`, id), acc);

    return acc;
  };
}

function mapSession(state) {
  return {
    id: state.id,
    uxSessionId: state.uxSessionId,
    meals: state.meals.reduce((acc, meal, idx) => {
      const mealIndex = `${meal.name.en}:${meal.time?.hours ?? 0}:${meal.time?.minutes ?? 0}`;

      // There are submissions with duplicate meals (same name and time)
      if (acc[mealIndex]) {
        acc[mealIndex].foods = meal.foods.reduce(mapFoods(`state.meals[${idx}].foods`), acc[mealIndex].foods);
        acc[mealIndex].isDuplicate = true;
        return acc;
      }

      acc[mealIndex] = {
        id: meal.id,
        name: meal.name.en,
        hours: meal.time?.hours ?? 0,
        minutes: meal.time?.minutes ?? 0,
        foods: meal.foods.reduce(mapFoods(`state.meals[${idx}].foods`), {}),
      };

      return acc;
    }, {}),
  };
}

/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('jobs', 'session_id', {
        type: Sequelize.UUID,
        allowNull: true,
      }, { transaction });

      await queryInterface.addIndex('jobs', ['session_id'], {
        name: 'jobs_session_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `UPDATE jobs SET session_id = (params->'state'->>'uxSessionId')::uuid WHERE type = 'SurveySubmission'`,
        { transaction },
      );

      await queryInterface.createTable(
        'ssf_cf',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
          },
          session_path: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          conversion_factor: {
            type: Sequelize.FLOAT,
            allowNull: false,
          },
          orig_nutrients: {
            type: Sequelize.JSONB,
            allowNull: false,
          },
          orig_portion_size: {
            type: Sequelize.JSONB,
            allowNull: false,
          },
          orig_session: {
            type: Sequelize.JSONB,
            allowNull: false,
          },
        },
        { transaction },
      );

      const dups = await queryInterface.sequelize.query(`
        SELECT COUNT(ss.id), ss.session_id
        FROM survey_submissions ss
        LEFT JOIN jobs j on ss.session_id = j.session_id and j."type" = 'SurveySubmission' AND j.successful = true
        GROUP BY ss.session_id
        HAVING COUNT(ss.id) > 1
        `, {
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      });

      if (dups.length) {
        console.log(dups.map(d => `session_id: ${d.session_id}, count: ${d.count}`).join('\n'));
        throw new Error(`Found ${dups.length} duplicate sessions matching the submissions`);
      }

      const count = await queryInterface.sequelize.query(`SELECT count(ss.id) FROM survey_submissions ss`, {
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      });

      const total = count[0].count;
      const batchSize = 200;
      const startOffset = 0;

      const offsets = [];
      let start = startOffset;

      while (start < total) {
        offsets.push(start);
        start += batchSize;
      }

      const missingSessions = [];

      for (const offset of offsets) {
        const difference = batchSize + offset - total;
        console.log(`Processing offset: ${offset}, difference: ${difference}`);

        const submissions = await queryInterface.sequelize.query(`
        SELECT ss.id, ss.submission_time, ss.session_id, j.params
        FROM survey_submissions ss
        LEFT JOIN jobs j on ss.session_id = j.session_id and j."type" = 'SurveySubmission' and j.successful = true
        ORDER BY ss.survey_id, ss.submission_time, ss.id
        LIMIT :limit OFFSET :offset
        `, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            limit: difference > 0 ? batchSize - difference : batchSize,
            offset,
          },
          transaction,
        });

        for (const submission of submissions) {
          if (!submission.params) {
            missingSessions.push({ id: submission.id, session_id: submission.session_id });
            console.warn(`No job params found for submission id: ${submission.id}, session_id: ${submission.session_id}`);
            continue;
          }

          const originalSession = cloneDeep(submission.params);
          const newSession = cloneDeep(submission.params);
          const state = mapSession(submission.params.state);

          const dbFoods = await queryInterface.sequelize.query(`
            SELECT ssf.id, ssf.parent_id, ssf.meal_id, ssf.code, ssf.english_name, ssf.portion_size_method_id, ssf."index", ssf.nutrients, ssf.portion_size,
            ssm.name, ssm.hours, ssm.minutes,
            CASE
              WHEN ss.wake_up_time is not null and CONCAT(hours, ':', minutes)::time < ss.wake_up_time THEN CONCAT(hours,':',minutes)::interval  + '1440m'::interval
              ELSE CONCAT(hours,':',minutes)::interval
            END as "interval"
            FROM survey_submission_foods ssf
            join survey_submission_meals ssm on ssf.meal_id = ssm.id
            join survey_submissions ss on ssm.survey_submission_id = ss.id
            where ss.id = :submissionId
            order by ss.submission_time , ss.id, interval, ssm."name", ssf."index"
          `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { submissionId: submission.id },
            transaction,
          });

          const foodPathAlreadyIncluded = [];

          const foodsToUpdate = dbFoods.reduce((acc, dbFood) => {
            const mealIndex = `${dbFood.name}:${dbFood.hours}:${dbFood.minutes}`;
            if (!state.meals[mealIndex])
              throw new Error(`Meal not found for food: ${dbFood.id}, session: ${state.uxSessionId}`);

            /*
            *  Use more complex matching as food indexes are not reliable due to 1) duplicate meals, 2) empty recipes being removed
            *  There foods that match by whole PSMs, like AFPs, sugar in tea, so such keep track and preassign them by order to update as the PSMs are some for update
            */
            const sessionFood = Object.values(state.meals[mealIndex].foods)
              .find((f) => {
                if (f.type === 'encoded-food' && f.data.code === dbFood.code
                  && dbFood.portion_size_method_id === f.portionSize.method
                  && isEqual(f.portionSize, dbFood.portion_size)) {
                  if (foodPathAlreadyIncluded.includes(f.path)) {
                    console.warn(`food path already included, looking for next one, skipping matching by PSM for food: ${dbFood.id}, session: ${state.uxSessionId}`);
                    return false;
                  }
                  else {
                    return true;
                  }
                }

                if (f.type === 'recipe-builder' && f.template.code === dbFood.code
                  && dbFood.portion_size_method_id === 'recipe-builder'
                  && !foodPathAlreadyIncluded.includes(f.path)) {
                  return true;
                }

                return false;
              });

            if (!sessionFood) {
              console.log(state.meals[mealIndex].foods);
              throw new Error(`Food index not found for food: ${dbFood.id}, session: ${state.uxSessionId}`);
            }

            /* Skip
            *  - recipe builder foods
            *  - foods with unaffected portion size methods (only ['as-served', 'cereal', 'drink-scale', 'milk-on-cereal', 'pizza'] are affected)
            *  - foods with conversion factor 1, which is already correct
            */
            if (dbFood.portion_size_method_id === 'recipe-builder')
              return acc;

            if (!['as-served', 'cereal', 'drink-scale', 'milk-on-cereal', 'pizza'].includes(dbFood.portion_size_method_id))
              return acc;

            const psm = sessionFood.data.portionSizeMethods[sessionFood.portionSizeMethodIndex];
            if (!psm)
              throw new Error(`Portion size method not found for food: ${dbFood.id}, session: ${state.uxSessionId}`);

            if (psm.conversionFactor === 1)
              return acc;

            const foodPsm = dbFood.portion_size;

            const originalServingWeight = get(originalSession, `${sessionFood.path}.portionSize.servingWeight`);
            const originalLeftoversWeight = get(originalSession, `${sessionFood.path}.portionSize.leftoversWeight`);

            if (originalServingWeight !== foodPsm.servingWeight || originalLeftoversWeight !== foodPsm.leftoversWeight)
              throw new Error(`Original portion size weights mismatch for food: ${dbFood.id}`);

            const servingWeight = foodPsm.servingWeight * psm.conversionFactor;
            const leftoversWeight = foodPsm.leftoversWeight * psm.conversionFactor;

            // Update the food in the database with new portion size
            acc.push({
              dbFood,
              sessionFood,
              psm: { ...cloneDeep(foodPsm), servingWeight, leftoversWeight },
              conversionFactor: psm.conversionFactor,
              origPsm: foodPsm,
              origNutrients: dbFood.nutrients,
            });
            const path = `${sessionFood.path}.portionSize`;

            // patch the session object with new weights
            set(newSession, `${path}.servingWeight`, servingWeight);
            set(newSession, `${path}.leftoversWeight`, leftoversWeight);

            foodPathAlreadyIncluded.push(sessionFood.path);

            return acc;
          }, []);

          if (!foodsToUpdate.length)
            continue;

          const values = foodsToUpdate.map((f) => {
            const id = queryInterface.sequelize.escape(f.dbFood.id);
            const psm = `${queryInterface.sequelize.escape(JSON.stringify(f.psm))}::jsonb`;
            return `(${id}, ${psm})`;
          }).join(',');

          await queryInterface.sequelize.query(
            `UPDATE survey_submission_foods as ssf SET portion_size = data.psm::jsonb
              FROM (VALUES ${values}) AS data(id, psm)
              WHERE data.id::uuid = ssf.id;`,
            { transaction },
          );

          await queryInterface.sequelize.query(
            `UPDATE jobs SET params = :params WHERE session_id = :id;`,
            {
              type: Sequelize.QueryTypes.UPDATE,
              replacements: { id: submission.session_id, params: JSON.stringify(newSession) },
              transaction,
            },
          );

          const insertValues = foodsToUpdate.map((f) => {
            const id = `${queryInterface.sequelize.escape(f.dbFood.id)}::uuid`;
            const path = queryInterface.sequelize.escape(f.sessionFood.path);
            const conversionFactor = f.conversionFactor;
            const nutrients = `${queryInterface.sequelize.escape(JSON.stringify(f.origNutrients))}::jsonb`;
            const psm = `${queryInterface.sequelize.escape(JSON.stringify(f.origPsm))}::jsonb`;
            const session = `${queryInterface.sequelize.escape(JSON.stringify(originalSession))}::jsonb`;
            return `(${id}, ${path}, ${conversionFactor}, ${nutrients}, ${psm}, ${session})`;
          }).join(',');

          await queryInterface.sequelize.query(
            `INSERT INTO ssf_cf (id, session_path, conversion_factor, orig_nutrients, orig_portion_size, orig_session) VALUES ${insertValues};`,
            { transaction },
          );

          console.log(`Updated session: ${state.uxSessionId}, submission id: ${submission.id}, foods updated: ${foodsToUpdate.length}`);

          for (const f of foodsToUpdate) {
            console.log(
              `Session: ${state.uxSessionId}`,
              `Food: ${f.dbFood.id}`,
              `path: ${f.sessionFood.path}`,
              `conversion factor: ${f.conversionFactor}`,
              get(originalSession, `${f.sessionFood.path}.portionSize.servingWeight`),
              get(originalSession, `${f.sessionFood.path}.portionSize.leftoversWeight`),
              get(newSession, `${f.sessionFood.path}.portionSize.servingWeight`),
              get(newSession, `${f.sessionFood.path}.portionSize.leftoversWeight`),
            );
          }
        }
      }

      missingSessions.forEach((s) => {
        console.log(`Missing session - submission id: ${s.id}, session_id: ${s.session_id}`);
      });

      await queryInterface.removeColumn('jobs', 'session_id', { transaction });
    }),

  down: async () => {
    throw new Error('This migration cannot be undone');
  },
};
