import { updateSequence } from '../../utils.js';

export default {
  up: queryInterface =>
    queryInterface.sequelize.transaction(async (transaction) => {
      await updateSequence('food_portion_size_methods', 'id', {
        queryInterface,
        transaction,
      });
    }),

  down: () => {
    throw new Error('This migration cannot be undone');
  },
};
