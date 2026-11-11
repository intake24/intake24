import type { FAQRequest } from '@intake24/common/types/http/admin';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { FAQ, UserSecurable } from '@intake24/db';

export default () => {
  const baseUrl = '/api/admin/faqs';
  const permissions = ['faqs:delete'];

  let url: string;
  let invalidUrl: string;

  let input: FAQRequest;
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
      await suite.util.setPermission([]);
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

    it('should remove users\' access and derived resource permission', async () => {
      const { adminUserService } = ioc.cradle;
      const [deleted, kept] = await Promise.all([
        FAQ.create({
          ...mocker.system.faq(),
          ownerId: suite.data.system.user.id,
        }),
        FAQ.create(mocker.system.faq()),
      ]);
      const [onlyDeleted, alsoKept] = await Promise.all([
        adminUserService.create({ email: 'faq-destroy-only@example.com', password: undefined }),
        adminUserService.create({ email: 'faq-destroy-also@example.com', password: undefined }),
      ]);

      await adminUserService.setSecurableActions(onlyDeleted.id, { securableType: 'FAQ', securableId: deleted.id }, ['read']);
      await adminUserService.setSecurableActions(alsoKept.id, { securableType: 'FAQ', securableId: deleted.id }, ['read']);
      await adminUserService.setSecurableActions(alsoKept.id, { securableType: 'FAQ', securableId: kept.id }, ['read']);

      await suite.sharedTests.assertRecordDeleted('delete', `${baseUrl}/${deleted.id}`);

      const [securables, onlyDeletedPermissions, alsoKeptPermissions] = await Promise.all([
        UserSecurable.count({
          where: { securableType: 'FAQ', securableId: deleted.id },
        }),
        ioc.cradle.aclCache.getPermissions(onlyDeleted.id),
        ioc.cradle.aclCache.getPermissions(alsoKept.id),
      ]);
      expect(securables).toBe(0);
      expect(onlyDeletedPermissions).not.toContain('faqs');
      expect(alsoKeptPermissions).toContain('faqs');
    });
  });
};
