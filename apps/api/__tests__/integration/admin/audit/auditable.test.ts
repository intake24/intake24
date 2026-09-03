import type { BaseModel } from '@intake24/db';

import { camelCase } from 'lodash-es';
import { singular } from 'pluralize';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { permissions } from '@intake24/common-backend/acl';
import { models } from '@intake24/db';

export default (/* type: MediaModel */) => () => {
  const baseUrl = '/api/admin/audit/log';
  const resources = permissions.filter(p => p.name.endsWith(':audit')).map(p => p.name.split(':')[0]);

  // Stores created records per resource
  const recordIds: Record<string, string> = {};

  // 1. Create records globally before running any tests
  beforeAll(async () => {
    for (const resource of resources) {
      const item = singular(camelCase(resource)) as any;
      if (item === 'asServedSet')
        continue;

      try {
        const modelName = item.charAt(0).toUpperCase() + item.slice(1);
        // @ts-expect-error not typed
        const model = (models.system[modelName] ?? models.foods[modelName]) as unknown as BaseModel;
        // @ts-expect-error not typed
        const input = await (mocker.foods[item]?.() ?? mocker.system[item]?.());

        if (!input || !model) {
          console.warn(`No mocker found for resource: ${resource}, item: ${item}, modelName: ${modelName}`);
          continue;
        }

        // @ts-expect-error not typed
        const record = await model.create(input);
        recordIds[resource] = record.id;
      }
      catch (error) {
        console.error(`Error creating mock record for resource: ${resource}, item: ${item}`, error);
      }
    }
  });

  for (const resource of resources) {
    const permList = [resource, `${resource}:audit`];
    const invalidUrl = `${baseUrl}/${resource}/999999`;

    const getUrl = () => `${baseUrl}/${resource}/${recordIds[resource]}`;

    describe(`Resource Audit: ${resource}`, () => {
      beforeEach((ctx) => {
        if (!recordIds[resource]) {
          console.warn(`Skipping tests for ${resource}: Record was not created in beforeAll.`);
          ctx.skip();
        }
      });

      it(`${resource}: missing authentication / authorization`, async () => {
        const url = getUrl();
        console.log(`Testing URL: ${url}`);
        console.log(permList);
        await suite.sharedTests.assert401and403('get', getUrl(), { permissions: [resource, `${resource}:audit`] });
      });

      describe('authenticated / resource authorized', () => {
        beforeAll(async () => {
          await suite.util.setPermission(permList);
        });

        it(`${resource}: should return 200 and empty response when record doesn't exist`, async () => {
          await suite.sharedTests.assertAcknowledged('get', invalidUrl, { result: true });
        });
      });

      describe(`${resource}: authenticated / securables authorized`, () => {
        beforeAll(async () => {
          await suite.util.setPermission([resource]);
        });

        it(`${resource}: should return 403 when missing securable`, async () => {
          await suite.sharedTests.assertMissingAuthorization('get', getUrl());
        });
      });
    });
  }
};
