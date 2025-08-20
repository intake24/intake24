import { suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const permissions = ['languages', 'languages:translations'];

  let languageId: string;
  let url: string;

  beforeAll(async () => {
    languageId = suite.data.system.Language.id;

    url = `/api/admin/languages/${languageId}/translations`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  it('should return 204 and no content', async () => {
    await suite.util.setPermission(permissions);

    await suite.sharedTests.assertRecordDeleted('delete', url);
  });
};
