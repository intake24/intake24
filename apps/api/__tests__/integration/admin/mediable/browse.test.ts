import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { MediaModel } from '@intake24/common/types/http/admin';
import type { BaseModel } from '@intake24/db';

import { camelCase } from 'lodash-es';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { modelToResource } from '@intake24/common/util';
import { models } from '@intake24/db';

export default (type: MediaModel) => () => {
  const resource = modelToResource(type);
  const baseUrl = `/api/admin/${resource}`;
  const permissions = [resource, `${resource}:media`];

  let url: string;
  const invalidUrl = `${baseUrl}/999999/media`;

  let model: BaseModel;
  let securable: SetSecurableOptions;

  beforeAll(async () => {
    // @ts-expect-error not typed
    const modelInput = mocker.system[camelCase(type)]();
    // @ts-expect-error not typed
    model = await models.system[type].create(modelInput);

    securable = { securableId: model.id, securableType: type };

    url = `${baseUrl}/${model.id}/media`;
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

    it('should return 200 and paginated results', async () => {
      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission([resource]);
    });

    it('should return 403 when missing securable', async () => {
      await suite.sharedTests.assertMissingAuthorization('get', url);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['media'] });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await model.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });
  });
};
