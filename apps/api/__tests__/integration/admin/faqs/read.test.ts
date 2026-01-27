import type { SetSecurableOptions } from '@intake24/api-tests/integration/helpers';
import type { FAQRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { FAQ } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/faqs';
  const permissions = ['faqs', 'faqs:read'];

  let url: string;
  let invalidUrl: string;

  let input: FAQRequest;
  let output: FAQRequest;
  let faq: FAQ;

  let securable: SetSecurableOptions;

  beforeAll(async () => {
    input = mocker.system.faq();
    faq = await FAQ.create(input);
    output = { ...input };

    securable = { securableId: faq.id, securableType: 'FAQ' };

    url = `${baseUrl}/${faq.id}`;
    invalidUrl = `${baseUrl}/999999`;
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
      await suite.sharedTests.assertRecord('get', url, output);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['faqs']);
    });

    it('should return 200 and data when securable set', async () => {
      await suite.util.setSecurable({ ...securable, action: ['read'] });

      await suite.sharedTests.assertRecord('get', url, output);
    });

    it('should return 200 and data when owner set', async () => {
      await suite.util.setSecurable(securable);
      await faq.update({ ownerId: suite.data.system.user.id });

      await suite.sharedTests.assertRecord('get', url, output);
    });
  });
};
