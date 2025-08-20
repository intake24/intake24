import securable from '../securable/index.test';
import browse from './browse.test';
import destroy from './destroy.test';
import read from './read.test';
import store from './store.test';
import translations from './translations/index.test';
import update from './update.test';

export default () => {
  describe('get /api/admin/languages', browse);
  describe('post /api/admin/languages', store);
  describe('get /api/admin/languages/:languageId', read);
  describe('put /api/admin/languages/:languageId', update);
  describe('delete /api/admin/languages/:languageId', destroy);

  describe('get /api/admin/languages/:languageId/translations', translations.browse);
  describe('post /api/admin/languages/:languageId/translations', translations.store);
  describe('put /api/admin/languages/:languageId/translations', translations.update);
  describe('delete /api/admin/languages/:languageId/translations', translations.destroy);
  // describe('POST /api/admin/languages/:languageId/translations/sync', translations.sync);
  securable('/api/admin/languages/:languageId', 'Language');
};
