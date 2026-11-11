import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/survey-scheme-prompts/refs';
  const permissions = ['survey-scheme-prompts:browse'];

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  it('should return 200 and refs', async () => {
    await suite.util.setPermission(permissions);

    await suite.sharedTests.assertReferencesResult('get', url, ['schemes', 'promptIds']);
  });
};
