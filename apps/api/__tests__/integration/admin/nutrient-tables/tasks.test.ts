import type { NutrientTableRequest } from '@intake24/common/types/http/admin';

import fs from 'node:fs';

import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { NutrientTable } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/nutrient-tables';
  const permissions = ['nutrient-tables', 'nutrient-tables:tasks'];

  let url: string;
  let invalidUrl: string;

  let input: NutrientTableRequest;
  let nutrientTable: NutrientTable;

  const fileName = 'importNutrientTable.csv';
  let filePath: string;

  beforeAll(async () => {
    input = mocker.foods.nutrientTable();

    nutrientTable = await NutrientTable.create(input, {
      include: [
        { association: 'csvMapping' },
        { association: 'csvMappingFields' },
        { association: 'csvMappingNutrients' },
      ],
    });

    filePath = suite.files.data.csv;

    url = `${baseUrl}/${nutrientTable.id}/tasks`;
    invalidUrl = `${baseUrl}/999999/tasks`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assertMissingAuthentication('post', url);
  });

  it('should return 403 when missing permissions', async () => {
    const { status } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .attach('params[file]', fs.createReadStream(filePath), fileName);

    expect(status).toBe(403);
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['type']);
    });

    it('should return 400 for invalid input data', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('type', 'NutrientTableMappingImport')
        .field('params[nutrientTableId]', false)
        .field('params[file]', '../../invalid_001');

      expect(status).toBe(400);
      expect(body).toContainAllKeys(['errors', 'message']);
      expect(body.errors).toContainAllKeys(['params.file']);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      const { status } = await request(suite.app)
        .post(invalidUrl)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('type', 'NutrientTableMappingImport')
        .field('params[nutrientTableId]', nutrientTable.id)
        .attach('params[file]', fs.createReadStream(filePath), fileName);

      expect(status).toBe(404);
    });

    it('should return 200 and job resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .field('type', 'NutrientTableMappingImport')
        .field('params[nutrientTableId]', nutrientTable.id)
        .attach('params[file]', fs.createReadStream(filePath), fileName);

      expect(status).toBe(200);
      expect(body).not.toBeEmpty();
    });
  });
};
