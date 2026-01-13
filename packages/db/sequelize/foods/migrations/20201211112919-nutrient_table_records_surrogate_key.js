export default {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('nutrient_table_records', 'v3_nutrient_table_records', {
        transaction,
      });

      await queryInterface.createTable(
        'nutrient_table_records',

        {
          id: {
            type: Sequelize.DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
          },
          nutrient_table_id: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
          nutrient_table_record_id: {
            type: new Sequelize.DataTypes.STRING(32),
            allowNull: false,
          },
          name: {
            type: new Sequelize.DataTypes.STRING(512),
            allowNull: false,
          },
          local_name: {
            type: new Sequelize.DataTypes.STRING(512),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'INSERT INTO nutrient_table_records (nutrient_table_id, nutrient_table_record_id, name, local_name) SELECT nutrient_table_id, id, english_description, local_description FROM v3_nutrient_table_records',
        { transaction },
      );

      await queryInterface.addIndex('nutrient_table_records', ['nutrient_table_id'], {
        name: 'nutrient_table_records_nutrient_table_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addIndex('nutrient_table_records', ['nutrient_table_record_id'], {
        name: 'nutrient_table_records_nutrient_nutrient_table_record_id_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.addConstraint('nutrient_table_records', {
        fields: ['nutrient_table_id', 'nutrient_table_record_id'],
        type: 'unique',
        name: 'nutrient_table_records_unique',
        transaction,
      });
    });
  },

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
