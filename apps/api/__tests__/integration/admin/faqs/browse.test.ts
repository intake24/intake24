import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import { FAQ } from '@intake24/db';

export default () => {
  const url = '/api/admin/faqs';
  const permissions = ['faqs', 'faqs:browse'];

  let faq: FAQ;

  beforeAll(async () => {
    const input = mocker.system.faq();

    faq = await FAQ.create(input);
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('get', url);
  });

  describe('authenticated / resource authorized', () => {
    it('should return 200 and paginated results', async () => {
      await suite.util.setPermission(permissions);

      await suite.sharedTests.assertPaginatedResult('get', url, { result: true });
    });

    it('should return 200 and empty paginated results', async () => {
      await suite.util.setPermission('faqs');

      await suite.sharedTests.assertPaginatedResult('get', url, { result: false });
    });

    it('should return 200 and with record access', async () => {
      await suite.util.setSecurable({
        securableId: faq.id,
        securableType: 'FAQ',
        action: ['read'],
      });

      await suite.sharedTests.assertPaginatedResult('get', url, { result: faq.id });
    });
  });
};
