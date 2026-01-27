import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { FeedbackSchemeCreationAttributes } from '@intake24/db';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { FeedbackScheme } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/feedback-schemes';
  const permissions = ['feedback-schemes', 'feedback-schemes:edit'];

  let url: string;
  let invalidUrl: string;

  let input: FeedbackSchemeCreationAttributes;
  let updateInput: FeedbackSchemeCreationAttributes;
  let scheme: FeedbackScheme;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.feedbackScheme();
    updateInput = mocker.system.feedbackScheme();
    scheme = await FeedbackScheme.create(input);

    securable = { securableId: scheme.id, securableType: 'FeedbackScheme' };

    url = `${baseUrl}/${scheme.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('patch', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('patch', url, []);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        name: [],
        type: 'invalidType',
        visibility: 'invalidVisibility',
        outputs: 'not an array of outputs',
        physicalDataFields: true,
        sections: [{ id: 'invalidId' }],
        topFoods: {
          max: false,
          colors: 10,
          nutrientTypes: [{ id: '49', name: { en: 'Fat' } }],
        },
        // cards: 'notAnArray',
        demographicGroups: [
          {
            nutrientRuleType: 'percentage_of_energy',
            nutrientTypeId: '49',
            physicalActivityLevelId: null,
          },
        ],
        henryCoefficients: [{ age: { start: 0, end: 3 }, constant: -371 }],
      };

      const fields = [
        'name',
        'type',
        'visibility',
        'outputs',
        'physicalDataFields',
        'sections.0',
        'topFoods.max',
        'topFoods.colors',
        'topFoods.nutrientTypes.0.id',
        'demographicGroups.0.id',
        'demographicGroups.0.type',
        'demographicGroups.0.age',
        'demographicGroups.0.height',
        'demographicGroups.0.weight',
        'demographicGroups.0.scaleSectors',
        'demographicGroups.0.sex',
        'henryCoefficients.0.id',
        'henryCoefficients.0.sex',
        'henryCoefficients.0.weightCoefficient',
        'henryCoefficients.0.heightCoefficient',
      ];

      await suite.sharedTests.assertInvalidInput('patch', url, fields, { input: invalidInput });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('patch', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('patch', url, updateInput);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['feedback-schemes']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['edit'] });
      const updateInput2 = mocker.system.feedbackScheme();

      await suite.sharedTests.assertRecordUpdated('patch', url, updateInput2);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await scheme.update({ ownerId: suite.data.system.user.id });

      const updateInput3 = mocker.system.feedbackScheme();

      await suite.sharedTests.assertRecordUpdated('patch', url, updateInput3);
    });
  });
};
