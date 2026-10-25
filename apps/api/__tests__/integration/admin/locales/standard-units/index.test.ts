import browse from './browse.test';
import categories from './categories.test';
import destroy from './destroy.test';
import foods from './foods.test';
import read from './read.test';
import store from './store.test';
import update from './update.test';

export default () => {
  describe('get /api/admin/locales/:localeId/standard-units', browse);
  describe('post /api/admin/locales/:localeId/standard-units', store);
  describe('get /api/admin/locales/:localeId/standard-units/:standardUnitId', read);
  describe('put /api/admin/locales/:localeId/standard-units/:standardUnitId', update);
  describe('delete /api/admin/locales/:localeId/standard-units/:standardUnitId', destroy);
  describe('get /api/admin/locales/:localeId/standard-units/:standardUnitId/categories', categories);
  describe('get /api/admin/locales/:localeId/standard-units/:standardUnitId/foods', foods);
};
