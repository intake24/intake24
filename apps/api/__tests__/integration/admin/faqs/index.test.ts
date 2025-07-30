import browse from './browse.test';
import copy from './copy.test';
import destroy from './destroy.test';
import put from './put.test';
import read from './read.test';
import store from './store.test';

export default () => {
  describe('get /api/admin/faqs', browse);
  describe('post /api/admin/faqs', store);
  describe('get /api/admin/faqs/:faqId', read);
  describe('put /api/admin/faqs/:faqId', put);
  describe('delete /api/admin/faqs/:faqId', destroy);
  describe('post /api/admin/faqs/:faqId/copy', copy);
};
