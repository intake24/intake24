import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import type { FAQRequest } from '@intake24/common/types/http/admin';
import { FAQ } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/faqs';
  const permissions = ['faqs', 'faqs:delete'];

  let url: string;
  let invalidUrl: string;

  let input: Pick<FAQRequest, 'name'>;
  let faq: FAQ;

  beforeAll(async () => {
    input = mocker.system.faq();
    faq = await FAQ.create(input);

    url = `${baseUrl}/${faq.id}`;
    invalidUrl = `${baseUrl}/999999`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('delete', url, { permissions });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it(`should return 404 when record doesn't exist`, async () => {
      await suite.sharedTests.assertMissingRecord('delete', invalidUrl);
    });

    it('should return 204 and no content', async () => {
      await suite.sharedTests.assertRecordDeleted('delete', url);
    });
  });

  describe('authenticated / securables authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(['faqs']);
    });

    it('should return 204 and no content when securable set', async () => {
      const { id } = await FAQ.create(mocker.system.faq());
      await suite.util.setSecurable({
        securableId: id,
        securableType: 'FAQ',
        action: ['delete'],
      });

      await suite.sharedTests.assertRecordDeleted('delete', `${baseUrl}/${id}`);
    });

    it('should return 204 and no content when owner set', async () => {
      const { id } = await FAQ.create({
        ...mocker.system.faq(),
        ownerId: suite.data.system.user.id,
      });

      await suite.sharedTests.assertRecordDeleted('delete', `${baseUrl}/${id}`);
    });
  });
};
