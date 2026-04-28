import jobs from './jobs/index.test';
import personalAccessTokens from './personal-access-tokens/index.test';
import profile from './profile.test';
import update from './update.test';
import verify from './verify.test';

export default () => {
  describe('get /api/admin/user', profile);
  describe('patch /api/admin/user', update);
  describe('get /api/admin/user/verify', verify);

  describe('get /api/admin/user/jobs', jobs.browse);
  describe('post /api/admin/user/jobs', jobs.submit);
  describe('get /api/admin/user/jobs/:jobId', jobs.read);
  describe('get /api/admin/user/jobs/:jobId/download', jobs.download);

  describe('get /api/admin/user/personal-access-tokens', personalAccessTokens.browse);
  describe('post /api/admin/user/personal-access-tokens', personalAccessTokens.issue);
  describe('delete /api/admin/user/personal-access-tokens/:tokenId', personalAccessTokens.revoke);
};
