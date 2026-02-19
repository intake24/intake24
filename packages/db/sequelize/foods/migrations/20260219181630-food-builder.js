import { nanoid } from 'nanoid';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'food_builders',
        {
          id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          code: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          locale_id: {
            type: Sequelize.STRING(64),
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(256),
            allowNull: false,
          },
          trigger_word: {
            type: Sequelize.STRING(512),
            allowNull: false,
          },
          synonym_set_id: {
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          type: {
            type: Sequelize.ENUM('generic', 'recipe'),
            allowNull: false,
          },
          steps: {
            type: Sequelize.JSONB,
            allowNull: false,
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

      await queryInterface.addIndex('food_builders', ['code'], {
        name: 'food_builders_code_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('food_builders', {
        fields: ['locale_id'],
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        name: 'food_builders_locale_id_fk',
        transaction,
      });

      await queryInterface.addIndex('food_builders', ['locale_id'], {
        name: 'food_builders_locale_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('food_builders', {
        fields: ['code', 'locale_id'],
        type: 'unique',
        name: 'food_builders_unique',
        transaction,
      });

      await queryInterface.addConstraint('food_builders', {
        fields: ['synonym_set_id'],
        type: 'foreign key',
        references: {
          table: 'synonym_sets',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        name: 'food_builders_synonym_set_id_fk',
        transaction,
      });

      await queryInterface.addIndex('food_builders', ['synonym_set_id'], {
        name: 'food_builders_synonym_set_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.sequelize.query(
        `INSERT INTO food_builders (code, locale_id, name, trigger_word, synonym_set_id, type, steps, created_at, updated_at)
          SELECT code, locale_id, "name", recipe_word, synonyms_id, 'recipe', '[]'::jsonb, created_at, updated_at FROM recipe_foods ORDER BY id;`,
        { transaction },
      );

      const records = await queryInterface.sequelize.query(`
        SELECT * FROM recipe_foods ORDER BY id`, {
        type: Sequelize.QueryTypes.SELECT,
        transaction,
      });

      for (const record of records) {
        const rfSteps = await queryInterface.sequelize.query(
          `SELECT * FROM recipe_foods_steps WHERE recipe_foods_id = :recipeFoodId ORDER BY "order" ASC`,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { recipeFoodId: record.id },
            transaction,
          },
        );

        const steps = rfSteps.map(step => ({
          id: nanoid(6),
          type: 'ingredient',
          categoryCode: step.category_code,
          name: step.name,
          description: step.description,
          multiple: step.repeatable,
          required: step.required,
        }));

        await queryInterface.sequelize.query(
          `UPDATE food_builders SET steps = :steps WHERE id = :id;`,
          {
            replacements: {
              steps: JSON.stringify(steps),
              id: record.id,
            },
            transaction,
          },
        );
      }

      // await queryInterface.dropTable('recipe_foods_steps', { transaction });
      // await queryInterface.dropTable('recipe_foods', { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('food_builders', { transaction });
      await queryInterface.sequelize.query(`DROP TYPE enum_food_builders_type;`, { transaction });
    }),
};
