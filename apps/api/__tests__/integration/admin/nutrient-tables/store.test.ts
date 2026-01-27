import type { NutrientTableRequest } from '@intake24/common/types/http/admin';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';

export default () => {
  const url = '/api/admin/nutrient-tables';
  const permissions = ['nutrient-tables', 'nutrient-tables:create'];

  let input: NutrientTableRequest;
  let output: NutrientTableRequest;

  beforeAll(async () => {
    input = mocker.foods.nutrientTable();
    output = { ...input };
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, [
        'id',
        'description',
        'csvMapping',
        'csvMappingFields',
        'csvMappingNutrients',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'post',
        url,
        [
          'id',
          'description',
          'csvMapping.rowOffset',
          'csvMapping.idColumnOffset',
          'csvMapping.descriptionColumnOffset',
          'csvMappingFields.0.fieldName',
          'csvMappingFields.0.columnOffset',
          'csvMappingNutrients.0.nutrientTypeId',
          'csvMappingNutrients.0.columnOffset',
        ],
        {
          input: {
            id: null,
            description: [],
            csvMapping: { missingProps: false },
            csvMappingFields: [{ invalidField: 'fieldname' }],
            csvMappingNutrients: [{ invalidField: 'fieldname' }],
          },
        },
      );
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(status).toBe(201);

      const {
        csvMapping: resCsvMapping,
        csvMappingFields: resCsvMappingFields,
        csvMappingNutrients: resCsvMappingNutrients,
        ...restData
      } = body;
      const {
        csvMapping: outputCsvMapping,
        csvMappingFields: outputCsvMappingFields,
        csvMappingNutrients: outputCsvMappingNutrients,
        ...restOutput
      } = output;

      // 1) match the output
      expect(pick(restData, Object.keys(restOutput))).toEqual(restOutput);
      expect(pick(resCsvMapping, Object.keys(outputCsvMapping))).toEqual(outputCsvMapping);

      // 2) non-order specific comparison
      if (outputCsvMappingFields) {
        const fields: NutrientTableRequest['csvMappingFields'] = resCsvMappingFields.map(
          ({ fieldName, columnOffset }: NutrientTableRequest['csvMappingFields'][number]) => ({
            fieldName,
            columnOffset,
          }),
        );
        expect(fields).toIncludeSameMembers(outputCsvMappingFields);
      }

      if (outputCsvMappingNutrients) {
        const nutrients: NutrientTableRequest['csvMappingNutrients'] = resCsvMappingNutrients.map(
          ({
            nutrientTypeId,
            columnOffset,
          }: NutrientTableRequest['csvMappingNutrients'][number]) => ({
            nutrientTypeId,
            columnOffset,
          }),
        );
        expect(nutrients).toIncludeSameMembers(outputCsvMappingNutrients);
      }
    });

    it('should return 400 for duplicate id', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['id'], { input });
    });
  });
};
