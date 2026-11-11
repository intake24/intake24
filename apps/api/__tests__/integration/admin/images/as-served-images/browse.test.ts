import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/images/as-served-sets/asServedSetForImages/images';
  const invalidUrl = '/api/admin/images/as-served-sets/InvalidAsServedSetForImages/images';
  const permissions = ['as-served-sets:browse'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('get', invalidUrl);
    });

    it('should return 200 and paginated results', async () => {
      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });
  });
};
