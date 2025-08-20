import mediable from '../mediable/index.test';
import securable from '../securable/index.test';
import browse from './browse.test';
import copy from './copy.test';
import dataExport from './data-export.test';
import destroy from './destroy.test';
import patch from './patch.test';
import read from './read.test';
import refs from './refs.test';
import store from './store.test';
import templates from './templates.test';

export default () => {
  describe('get /api/admin/survey-schemes', browse);
  describe('post /api/admin/survey-schemes', store);
  describe('get /api/admin/survey-schemes/refs', refs);
  describe('post /api/admin/survey-schemes/copy', copy);
  describe('get /api/admin/survey-schemes/:surveySchemeId', read);
  describe('patch /api/admin/survey-schemes/:surveySchemeId', patch);
  describe('delete /api/admin/survey-schemes/:surveySchemeId', destroy);
  describe('get /api/admin/survey-schemes/:surveySchemeId/templates', templates);
  describe('get /api/admin/survey-schemes/:surveySchemeId/data-export', dataExport);
  mediable('/api/admin/survey-schemes/:surveySchemeId', 'SurveyScheme');
  securable('/api/admin/survey-schemes/:surveySchemeId', 'SurveyScheme');
};
