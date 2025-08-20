import securable from '../securable/index.test';
import browse from './browse.test';
import destroy from './destroy.test';
import read from './read.test';
// import recipeFoods from './recipe-foods/index.test';
import refs from './refs.test';
import splitLists from './split-lists/index.test';
import splitWords from './split-words/index.test';
import store from './store.test';
import synonymSets from './synonym-sets/index.test';
import tasks from './tasks.test';
import update from './update.test';

export default () => {
  describe('get /api/admin/locales', browse);
  describe('post /api/admin/locales', store);
  describe('get /api/admin/locales/refs', refs);
  describe('get /api/admin/locales/:localeId', read);
  describe('put /api/admin/locales/:localeId', update);
  describe('delete /api/admin/locales/:localeId', destroy);

  describe('post /api/admin/locales/:localeId/tasks', tasks);

  // describe('GET /api/admin/locales/:localeId/recipe-foods', recipeFoods.get);
  describe('get /api/admin/locales/:localeId/split-lists', splitLists.get);
  describe('post /api/admin/locales/:localeId/split-lists', splitLists.set);
  describe('get /api/admin/locales/:localeId/split-words', splitWords.get);
  describe('post /api/admin/locales/:localeId/split-words', splitWords.set);
  describe('get /api/admin/locales/:localeId/synonym-sets', synonymSets.get);
  describe('post /api/admin/locales/:localeId/synonym-sets', synonymSets.set);

  securable('/api/admin/locales/:localeId', 'Locale');
};
