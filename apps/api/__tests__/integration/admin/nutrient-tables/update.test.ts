import type { NutrientTableRequest } from '@intake24/common/types/http/admin';

import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { NutrientTable } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/nutrient-tables';
  const permissions = ['nutrient-tables', 'nutrient-tables:edit'];

  let url: string;
  let invalidUrl: string;

  let input: NutrientTableRequest;
  let updateInput: NutrientTableRequest;
  let output: NutrientTableRequest;
  let nutrientTable: NutrientTable;

  beforeAll(async () => {
    input = mocker.foods.nutrientTable();
    updateInput = mocker.foods.nutrientTable();

    const { id } = input;
    output = { ...updateInput, id };

    nutrientTable = await NutrientTable.create(input, {
      include: [
        { association: 'csvMapping' },
        { association: 'csvMappingFields' },
        { association: 'csvMappingNutrients' },
      ],
    });

    url = `${baseUrl}/${nutrientTable.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, [
        'description',
        'csvMapping',
        'csvMappingFields',
        'csvMappingNutrients',
      ]);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput(
        'put',
        url,
        [
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
            description: [],
            csvMapping: { missingProps: false },
            csvMappingFields: [{ invalidField: 'fieldname' }],
            csvMappingNutrients: [{ invalidField: 'fieldname' }],
          },
        },
      );
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(updateInput);

      expect(status).toBe(200);

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
  });
};
