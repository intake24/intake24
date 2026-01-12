import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import { suite } from '@intake24/api-tests/integration/helpers';
import type { MediaModel } from '@intake24/common/types/http/admin';
import { modelToResource } from '@intake24/common/util';
import type { Securable } from '@intake24/db';

export default (type: MediaModel) => () => {
  const resource = modelToResource(type);
  const baseUrl = `/api/admin/${resource}`;
  const permissions = [resource, `${resource}:media`];

  let url: string;
  const invalidUrl = `${baseUrl}/999999/media`;

  let securable: SetSecurableOptions;
  let securableModel: Securable;

  beforeAll(async () => {
    securableModel = suite.data.system[type];
    securable = { securableId: securableModel.id, securableType: type };

    url = `${baseUrl}/${securableModel.id}/media`;

    await suite.util.setPermission([]);
    await suite.util.setSecurable({ ...securable, action: [] });
    await securableModel.update({ ownerId: null });
  });

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

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([resource]);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['media'] });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await securableModel.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });
  });
};
