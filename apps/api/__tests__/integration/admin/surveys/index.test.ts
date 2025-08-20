import securable from '../securable/index.test';
import browse from './browse.test';
// import put from './put.test';
import destroy from './destroy.test';
import patch from './patch.test';
import read from './read.test';
import respondentCustomFields from './respondent-custom-fields/index.test';
import respondents from './respondents/index.test';
import store from './store.test';
import submissions from './submissions/index.test';
import tasks from './tasks.test';

export default () => {
  describe('get /api/admin/surveys', browse);
  describe('post /api/admin/surveys', store);
  describe('get /api/admin/surveys/:surveyId', read);
  describe('patch /api/admin/surveys/:surveyId', patch);
  // describe('PUT /api/admin/surveys/:surveyId', put);
  describe('delete /api/admin/surveys/:surveyId', destroy);

  // Surveys respondents
  describe('get /api/admin/surveys/:surveyId/respondents', respondents.browse);
  describe('post /api/admin/surveys/:surveyId/respondents', respondents.store);
  describe('get /api/admin/surveys/:surveyId/respondents/:username', respondents.read);
  describe('patch /api/admin/surveys/:surveyId/respondents/:username', respondents.update);
  describe('delete /api/admin/surveys/:surveyId/respondents/:username', respondents.destroy);
  // describe('GET /api/admin/surveys/:surveyId/respondents/:username/feedback', downloadFeedback);
  // describe('POST /api/admin/surveys/:surveyId/respondents/:username/feedback', emailFeedback);

  // Surveys respondents custom fields
  describe('get /api/admin/surveys/:surveyId/respondents/:username/custom-fields', respondentCustomFields.browse);
  describe('post /api/admin/surveys/:surveyId/respondents/:username/custom-fields', respondentCustomFields.store);
  describe('get /api/admin/surveys/:surveyId/respondents/:username/custom-fields/:field', respondentCustomFields.read);
  describe('patch /api/admin/surveys/:surveyId/respondents/:username/custom-fields/:field', respondentCustomFields.update);
  describe('put /api/admin/surveys/:surveyId/respondents/:username/custom-fields/:field', respondentCustomFields.upsert);
  describe('delete /api/admin/surveys/:surveyId/respondents/:username/custom-fields/:field', respondentCustomFields.destroy);

  // Surveys submissions
  describe('get /api/admin/surveys/:surveyId/submissions', submissions.browse);
  describe('get /api/admin/surveys/:surveyId/submissions/:submissionId', submissions.read);
  describe('delete /api/admin/surveys/:surveyId/submissions/:submissionId', submissions.destroy);

  // Surveys tasks
  describe('post /api/admin/surveys/:surveyId/tasks', tasks);

  securable('/api/admin/surveys/:surveyId', 'Survey');
};
