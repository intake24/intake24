import io from './io/index.test';
import nutrientTables from './nutrient-tables/index.test';
import surveys from './surveys/index.test';

export default () => {
  describe('io', io);
  describe('nutrient tables', nutrientTables);
  describe('surveys', surveys);
};
