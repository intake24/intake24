/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface, Sequelize) =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'user_identities',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.BIGINT,
          },
          user_id: {
            allowNull: false,
            type: Sequelize.BIGINT,
          },
          issuer: {
            allowNull: false,
            type: Sequelize.STRING(512),
          },
          subject: {
            allowNull: false,
            type: Sequelize.STRING(255),
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

      await queryInterface.addConstraint('user_identities', {
        fields: ['user_id'],
        name: 'user_identities_user_id_fk',
        type: 'foreign key',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        transaction,
      });

      await queryInterface.addConstraint('user_identities', {
        fields: ['issuer', 'subject'],
        name: 'user_identities_issuer_subject_unique',
        type: 'unique',
        transaction,
      });

      await queryInterface.addConstraint('user_identities', {
        fields: ['user_id', 'issuer'],
        name: 'user_identities_user_id_issuer_unique',
        type: 'unique',
        transaction,
      });

      // Fails on users_email_unique if two emails differ only by case; resolve those rows manually.
      await queryInterface.sequelize.query(
        'UPDATE users SET email = lower(email) WHERE email <> lower(email);',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER TABLE users ADD CONSTRAINT users_email_lowercase_check CHECK (email = lower(email));',
        { transaction },
      );

      await queryInterface.removeIndex('users', 'users_email_idx', { transaction });
    }),

  down: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('users', ['email'], {
        name: 'users_email_idx',
        indexType: 'btree',
        transaction,
      });

      await queryInterface.removeConstraint('users', 'users_email_lowercase_check', { transaction });

      await queryInterface.dropTable('user_identities', { transaction });
    }),
};
