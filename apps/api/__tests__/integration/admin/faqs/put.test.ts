import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { FAQRequest } from '@intake24/common/types/http/admin';
import { FAQ } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/faqs';
  const permissions = ['faqs', 'faqs:edit'];

  let url: string;
  let invalidUrl: string;

  let input: FAQRequest;
  let updateInput: FAQRequest;
  let faq: FAQ;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.faq();
    updateInput = mocker.system.faq();
    faq = await FAQ.create(input);

    securable = { securableId: faq.id, securableType: 'FAQ' };

    url = `${baseUrl}/${faq.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, { input, permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['name', 'content', 'visibility']);
    });

    it('should return 400 for invalid input data', async () => {
      const invalidInput = {
        name: [],
        visibility: 'invalidVisibility',
        content: [{ question: 'What is a food diary?' }],
      };

      const fields = [
        'name',
        'visibility',
        'content.0.id',
        'content.0.title',
        'content.0.items',
      ];

      await suite.sharedTests.assertInvalidInput('put', url, fields, { input: invalidInput });
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('put', invalidUrl, { input: updateInput });
    });

    it('should return 200 and data', async () => {
      await suite.sharedTests.assertRecordUpdated('put', url, updateInput);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['faqs']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['edit'] });
      const updateInput2 = mocker.system.faq();

      await suite.sharedTests.assertRecordUpdated('put', url, updateInput2);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await faq.update({ ownerId: suite.data.system.user.id });

      const updateInput3 = mocker.system.faq();

      await suite.sharedTests.assertRecordUpdated('put', url, updateInput3);
    });
  });
};
