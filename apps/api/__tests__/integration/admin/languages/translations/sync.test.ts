import request from 'supertest';

import { mocker, suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { Language, LanguageTranslation } from '@intake24/db';

export default () => {
  const permissions = ['languages:translations'];

  let languageId: string;
  let url: string;

  beforeAll(async () => {
    languageId = suite.data.system.Language.id;
    url = `/api/admin/languages/${languageId}/translations/sync`;
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('post', url, { permissions });
  });

  it('should return 201 and delete sections not present in default messages', async () => {
    await suite.util.setPermission(permissions);

    const stale = await LanguageTranslation.create({
      languageId,
      application: 'admin',
      section: 'removed-section',
      messages: { title: 'Removed section' },
    });

    const { status, body } = await request(suite.app)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', suite.bearer.user)
      .send();

    expect(status).toBe(201);
    expect(body).toBeArray();
    expect(body).not.toBeEmpty();
    expect((body as any[]).find(item => item.id === stale.id)).toBeUndefined();
    expect(await LanguageTranslation.findByPk(stale.id)).toBeNull();
  });

  it('should keep sections missing in built-in locale but present in en', async () => {
    const [language] = await Language.findOrCreate({
      where: { code: 'fr' },
      defaults: {
        ...mocker.system.language(),
        code: 'fr',
      },
    });

    const audit = await LanguageTranslation.create({
      languageId: language.id,
      application: 'admin',
      section: 'audit',
      messages: { title: 'Audit' },
    });

    await ioc.cradle.languageService.syncLanguageTranslations(language.id);

    expect(await LanguageTranslation.findByPk(audit.id)).not.toBeNull();
  });
};
