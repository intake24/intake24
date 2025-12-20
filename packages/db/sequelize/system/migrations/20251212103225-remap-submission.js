const isEqual = require('lodash/isEqual');
const pick = require('lodash/pick');

function mapCustomPromptAnswers(sessionAnswers, dbAnswers) {
  return Object.entries(pick(sessionAnswers ?? {}, Object.keys(dbAnswers ?? {})))
    .reduce((acc, [k, v]) => {
      acc[k] = Array.isArray(v) ? v.join(', ') : v?.toString() ?? 'N/A';
      return acc;
    }, {});
}

function mapFoods(parentId) {
  return (acc, food) => {
    const { id, type, customPromptAnswers } = food;
    if (type === 'free-text')
      return acc;

    const index = Object.keys(acc).length;
    const record = { id, type, parentId, index, customPromptAnswers };

    if (type === 'recipe-builder') {
      acc[index] = { ...record, code: food.template.code };
    }
    else if (type === 'encoded-food') {
      acc[index] = { ...record, code: food.data.code, portionSize: food.portionSize };
    }
    else {
      acc[index] = { ...record };
    }

    if (food.linkedFoods.length)
      food.linkedFoods.reduce(mapFoods(id), acc);

    return acc;
  };
}

function mapSession(state) {
  return {
    id: state.id,
    uxSessionId: state.uxSessionId,
    customPromptAnswers: state.customPromptAnswers,
    uniqueMeals: state.meals.map(meal => ({
      name: meal.name.en,
      hours: meal.time?.hours ?? 0,
      minutes: meal.time?.minutes ?? 0,
      customPromptAnswers: meal.customPromptAnswers,
    })),
    meals: state.meals.reduce((acc, meal) => {
      const mealIndex = `${meal.name.en}:${meal.time?.hours ?? 0}:${meal.time?.minutes ?? 0}`;

      // There are submissions with duplicate meals (same name and time)
      if (acc[mealIndex]) {
        acc[mealIndex].foods = meal.foods.reduce(mapFoods(), acc[mealIndex].foods);
        acc[mealIndex].isDuplicate = true;
        return acc;
      }

      acc[mealIndex] = {
        id: meal.id,
        name: meal.name.en,
        hours: meal.time?.hours ?? 0,
        minutes: meal.time?.minutes ?? 0,
        customPromptAnswers: meal.customPromptAnswers,
        foods: meal.foods.reduce(mapFoods(), {}),
      };

      return acc;
    }, {}),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
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
        `update jobs set session_id = (params->'state'->>'uxSessionId')::uuid where type = 'SurveySubmission'`,
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
      const batchSize = 100;
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
        SELECT ss.id, ss.submission_time, ss.session_id, ss.created_at, ss.updated_at, ss.custom_data, j.params
        FROM survey_submissions ss
        LEFT JOIN jobs j on ss.session_id = j.session_id and j."type" = 'SurveySubmission' and j.successful = true
        order by ss.survey_id, ss.submission_time, ss.id
        LIMIT :limit OFFSET :offset
        `, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            limit: difference > 0 ? batchSize - difference : batchSize,
            offset,
          },
          transaction,
        });

        const submissionsToUpdate = [];

        for (const submission of submissions) {
          if (!submission.params) {
            missingSessions.push({ id: submission.id, session_id: submission.session_id });
            console.warn(`No job params found for submission id: ${submission.id}, session_id: ${submission.session_id}`);
            continue;
          }

          const session = mapSession(submission.params.state);

          const sMappedCustom = mapCustomPromptAnswers(session.customPromptAnswers, submission.custom_data);
          if (!isEqual(sMappedCustom, submission.custom_data ?? {}))
            throw new Error(`Custom prompt answers mismatch for submission id: ${submission.id}, session: ${session.uxSessionId}`);

          const cSubmissionKeys = Object.keys(submission.custom_data ?? {});
          submissionsToUpdate.push({
            id: submission.id,
            custom: cSubmissionKeys.length ? pick(session.customPromptAnswers, cSubmissionKeys) : null,
          });

          // MEALS
          const meals = await queryInterface.sequelize.query(`
            SELECT ssm.id, ssm.hours, ssm.minutes, ssm.name, ssm.custom_data,
            CASE
              WHEN ss.wake_up_time is not null and CONCAT(hours, ':', minutes)::time < ss.wake_up_time THEN CONCAT(hours,':',minutes)::interval  + '1440m'::interval
              ELSE CONCAT(hours,':',minutes)::interval
            END as "interval"
            FROM survey_submission_meals ssm
            join survey_submissions ss on ssm.survey_submission_id = ss.id
            where ss.id = :submissionId
            order by ss.submission_time, ss.id, interval, ssm."name"
          `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { submissionId: submission.id },
            transaction,
          });

          const mealsToUpdate = meals.map((meal) => {
            const matchMeal = session.uniqueMeals.find((m) => {
              const mCustomDataMatch = isEqual(mapCustomPromptAnswers(m.customPromptAnswers, meal.custom_data), meal.custom_data ?? {});

              if (m.name === meal.name
                && m.hours === meal.hours
                && m.minutes === meal.minutes
                && mCustomDataMatch) {
                return true;
              }

              return false;
            });

            if (!matchMeal)
              throw new Error(`Meal not found for meal id: ${meal.id}, session: ${session.uxSessionId}`);

            const cMealKeys = Object.keys(meal.custom_data ?? {});
            return {
              id: meal.id,
              custom: cMealKeys.length ? pick(matchMeal.customPromptAnswers, cMealKeys) : null,
            };
          });

          if (mealsToUpdate.length) {
            const values = mealsToUpdate.map((m) => {
              const id = queryInterface.sequelize.escape(m.id);
              const custom = m.custom && Object.keys(m.custom).length ? `${queryInterface.sequelize.escape(JSON.stringify(m.custom))}::jsonb` : 'null';
              return `(${id}, ${custom})`;
            }).join(',');

            await queryInterface.sequelize.query(
              `UPDATE survey_submission_meals as ssm SET custom_data = data.custom::jsonb
              FROM (VALUES ${values}) AS data(id, custom)
              WHERE data.id::uuid = ssm.id;`,
              { transaction },
            );
          }

          // FOODS
          const foods = await queryInterface.sequelize.query(`
            SELECT ssf.id, ssf.parent_id, ssf.meal_id, ssf.code, ssf.english_name, ssf.portion_size_method_id, ssf."index", ssf.custom_data, ssf.portion_size,
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

          const foodsToUpdate = foods.map((food) => {
            const mealIndex = `${food.name}:${food.hours}:${food.minutes}`;
            if (!session.meals[mealIndex])
              throw new Error(`Meal not found for food: ${food.id}, session: ${session.uxSessionId}`);

            // Use more complex matching as food indexes are not reliable due to 1) duplicate meals, 2) empty recipes being removed
            const matchedFood = Object.values(session.meals[mealIndex].foods)
              .find((f) => {
                if (f.type === 'free-text' || f.type === 'missing-food')
                  return false;

                const fCustomDataMatch = isEqual(mapCustomPromptAnswers(f.customPromptAnswers, food.custom_data), food.custom_data ?? {});

                if (f.code === food.code
                  && f.type === 'encoded-food'
                  && food.portion_size_method_id === f.portionSize.method
                  && f.portionSize.servingWeight === Number(food.portion_size.servingWeight)
                  && f.portionSize.leftoversWeight === Number(food.portion_size.leftoversWeight)
                  && fCustomDataMatch) {
                  return true;
                }

                if (f.code === food.code
                  && food.portion_size_method_id === 'recipe-builder'
                  && f.type === 'recipe-builder'
                  && fCustomDataMatch
                ) {
                  return true;
                }

                return false;
              });

            if (!matchedFood)
              throw new Error(`Food index not found for food: ${food.id}, session: ${session.uxSessionId}`);

            const cFoodKeys = Object.keys(food.custom_data ?? {});
            const custom = cFoodKeys.length ? pick(matchedFood.customPromptAnswers, cFoodKeys) : null;
            if (cFoodKeys.length !== Object.keys(custom ?? {}).length)
              throw new Error(`Custom prompt answers keys mismatch for food: ${food.id}, session: ${session.uxSessionId}`);

            if (food.portion_size_method_id === 'recipe-builder') {
              if (matchedFood.type !== 'recipe-builder')
                throw new Error(`Session food type mismatch for recipe-builder food: ${food.id}`);

              return { id: food.id, custom, portionSize: null };
            }

            if (!matchedFood.portionSize)
              throw new Error(`Portion size not found for food: ${food.id}, session: ${session.uxSessionId}`);

            const matchedPsm = matchedFood.portionSize;
            const foodPsm = food.portion_size;

            if (matchedPsm.servingWeight !== Number(foodPsm.servingWeight)
              || matchedPsm.leftoversWeight !== Number(foodPsm.leftoversWeight)) {
              throw new Error(`Portion size weights mismatch for food: ${food.id}`);
            }

            return { id: food.id, custom, psm: matchedPsm };
          });

          // There are few empty submissions with no foods
          if (foodsToUpdate.length) {
            const values = foodsToUpdate.map((f) => {
              const id = queryInterface.sequelize.escape(f.id);
              const custom = f.custom && Object.keys(f.custom).length ? `${queryInterface.sequelize.escape(JSON.stringify(f.custom))}::jsonb` : 'null';
              const psm = f.psm ? `${queryInterface.sequelize.escape(JSON.stringify(f.psm))}::jsonb` : 'null';
              return `(${id}, ${custom}, ${psm})`;
            }).join(',');

            await queryInterface.sequelize.query(
              `UPDATE survey_submission_foods as ssf SET custom_data = data.custom::jsonb, portion_size = data.psm::jsonb
              FROM (VALUES ${values}) AS data(id, custom, psm)
              WHERE data.id::uuid = ssf.id;`,
              { transaction },
            );
          }
        }

        if (submissionsToUpdate.length) {
          const values = submissionsToUpdate.map((s) => {
            const id = queryInterface.sequelize.escape(s.id);
            const custom = s.custom && Object.keys(s.custom).length ? `${queryInterface.sequelize.escape(JSON.stringify(s.custom))}::jsonb` : 'null';
            return `(${id}, ${custom})`;
          }).join(',');

          await queryInterface.sequelize.query(
            `UPDATE survey_submissions as ss SET custom_data = data.custom::jsonb
            FROM (VALUES ${values}) AS data(id, custom)
            WHERE data.id::uuid = ss.id;`,
            { transaction },
          );
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
