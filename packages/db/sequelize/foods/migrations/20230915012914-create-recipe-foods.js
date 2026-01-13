export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      // Create Recipe Foods Table and Recipe_Foods Steps Table and Recipe_Foods <-> Category <-> Foods Table)
      await queryInterface.createTable(
        'recipe_foods',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          code: {
            allowNull: false,
            unique: false,
            type: Sequelize.STRING(16),
          },
          name: {
            allowNull: false,
            type: Sequelize.STRING(128),
          },
          locale_id: {
            allowNull: false,
            type: Sequelize.STRING(16),
          },
          recipe_word: {
            allowNull: false,
            type: Sequelize.STRING(512),
          },
          synonyms_id: {
            allowNull: true,
            type: Sequelize.BIGINT,
          },
          created_at: {
            allowNull: false,
            defaultValue: Sequelize.NOW,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            defaultValue: Sequelize.NOW,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'recipe_foods_steps',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          code: {
            allowNull: false,
            unique: true,
            type: Sequelize.STRING(128),
          },
          recipe_foods_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          category_code: {
            allowNull: true,
            unique: false,
            type: Sequelize.STRING(16),
          },
          locale_id: {
            allowNull: false,
            defaultValue: 'en_GB',
            type: Sequelize.STRING(16),
          },
          name: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          description: {
            allowNull: false,
            type: Sequelize.TEXT({ length: 'long' }),
          },
          order: {
            allowNull: false,
            type: Sequelize.INTEGER,
          },
          repeatable: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          created_at: {
            allowNull: false,
            defaultValue: Sequelize.NOW,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            defaultValue: Sequelize.NOW,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      // Add Indexes and FKs
      await queryInterface.addConstraint('recipe_foods', {
        fields: ['locale_id'],
        name: 'recipe_foods_locale_id_fk',
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('recipe_foods', {
        fields: ['synonyms_id'],
        name: 'recipe_foods_synonyms_fk',
        type: 'foreign key',
        references: {
          table: 'synonym_sets',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'set null',
        transaction,
      });

      await queryInterface.addConstraint('recipe_foods_steps', {
        fields: ['recipe_foods_id'],
        name: 'recipe_foods_id_fk',
        type: 'foreign key',
        references: {
          table: 'recipe_foods',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('recipe_foods_steps', {
        fields: ['category_code'],
        name: 'category_foods_code_fk',
        type: 'foreign key',
        references: {
          table: 'categories',
          field: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('recipe_foods_steps', {
        fields: ['locale_id'],
        name: 'recipe_foods_steps_locale_id_fk',
        type: 'foreign key',
        references: {
          table: 'locales',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addIndex('recipe_foods', ['code'], {
        name: 'recipe_foods_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('recipe_foods_steps', ['code'], {
        name: 'recipe_foods_steps_idx',
        fields: ['code', 'recipe_foods_id'],
        indexType: 'btree',
        transaction,
      });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('recipe_foods_steps', { transaction });
      await queryInterface.dropTable('recipe_foods', { transaction });
    }),
};
