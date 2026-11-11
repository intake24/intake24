import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/survey-schemes/refs';
  const permissions = ['survey-schemes:browse'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  it('should return 200 and refs', async () => {
    await suite.util.setPermission(permissions);

    await suite.sharedTests.assertReferencesResult('get', url, ['templates']);
  });
};
