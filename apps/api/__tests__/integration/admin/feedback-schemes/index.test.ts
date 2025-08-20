import mediable from '../mediable/index.test';
import securable from '../securable/index.test';
import browse from './browse.test';
import copy from './copy.test';
import destroy from './destroy.test';
import patch from './patch.test';
import read from './read.test';
import refs from './refs.test';
import store from './store.test';

export default () => {
  describe('get /api/admin/feedback-schemes', browse);
  describe('post /api/admin/feedback-schemes', store);
  describe('get /api/admin/feedback-schemes/refs', refs);
  describe('get /api/admin/feedback-schemes/:feedbackSchemeId', read);
  describe('patch /api/admin/feedback-schemes/:feedbackSchemeId', patch);
  describe('delete /api/admin/feedback-schemes/:feedbackSchemeId', destroy);
  describe('post /api/admin/feedback-schemes/:feedbackSchemeId/copy', copy);
  mediable('/api/admin/feedback-schemes/:feedbackSchemeId', 'FeedbackScheme');
  securable('/api/admin/feedback-schemes/:feedbackSchemeId', 'FeedbackScheme');
};
