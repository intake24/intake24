export default {
  up: (queryInterface) => {
    return queryInterface.renameTable(
      'foods_portion_size_method_params',
      'food_portion_size_method_params',
    );
  },

  down: (queryInterface) => {
    return queryInterface.renameTable(
      'food_portion_size_method_params',
      'foods_portion_size_method_params',
    );
  },
};
