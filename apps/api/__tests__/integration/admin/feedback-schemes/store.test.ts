import { pick } from 'lodash-es';
import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { FeedbackSchemeCreationAttributes } from '@intake24/db';

export default () => {
  const url = '/api/admin/feedback-schemes';
  const permissions = ['feedback-schemes', 'feedback-schemes:create'];

  let input: FeedbackSchemeCreationAttributes;
  let output: FeedbackSchemeCreationAttributes;

  beforeAll(async () => {
    input = mocker.system.feedbackScheme();
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
      await suite.sharedTests.assertInvalidInput('post', url, ['name']);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        name: [],
        type: 'invalidType',
        visibility: 1,
        outputs: ['print', 'invalid', 'download'],
        physicalDataFields: ['sex', 'invalid', 'weightKg'],
        sections: ['not a valid sections'],
        topFoods: {
          max: true,
          colors: 'color',
          nutrientTypes: null,
        },
        cards: 'notAnArray',
        demographicGroups: [
          {
            nutrientTypeId: '49',
            physicalActivityLevelId: null,
            sex: null,
            scaleSectors: [
              {
                name: { en: 'Total fat' },
                description: {
                  en: '<p>It is recommended that the energy (or calories)...</p>',
                },
                range: { start: 0, end: 100 },
                sentiment: 'good',
              },
            ],
          },
        ],
        henryCoefficients: [{ weightCoefficient: 28.2, heightCoefficient: 859 }],
      };

      const fields = [
        'name',
        'type',
        'visibility',
        'sections.0',
        'outputs.1',
        'physicalDataFields.1',
        'topFoods.max',
        'topFoods.colors',
        'topFoods.nutrientTypes',
        'cards',
        'demographicGroups.0.id',
        'demographicGroups.0.type',
        'demographicGroups.0.age',
        'demographicGroups.0.height',
        'demographicGroups.0.weight',
        'demographicGroups.0.nutrientRuleType',
        'demographicGroups.0.scaleSectors.0.summary',
        'demographicGroups.0.scaleSectors.0.intake',
        'henryCoefficients.0.id',
        'henryCoefficients.0.sex',
        'henryCoefficients.0.age',
        'henryCoefficients.0.constant',
      ];

      await suite.sharedTests.assertInvalidInput('post', url, fields, { input: invalidInput });
    });

    it('should return 201 and new resource', async () => {
      const { status, body } = await request(suite.app)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send(input);

      expect(pick(body, Object.keys(output))).toEqual(output);
      expect(body.ownerId).toBe(suite.data.system.user.id);
      expect(status).toBe(201);
    });

    it('should return 400 for duplicate name', async () => {
      await suite.sharedTests.assertInvalidInput('post', url, ['name'], {
        input: { ...mocker.system.feedbackScheme(), name: input.name },
      });
    });
  });
};
