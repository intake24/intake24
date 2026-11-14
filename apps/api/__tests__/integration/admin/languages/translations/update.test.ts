import type { LanguageTranslationAttributes } from '@intake24/db';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import ioc from '@intake24/api/ioc';
import { LanguageTranslation } from '@intake24/db';

export default () => {
  const permissions = ['languages:translations'];

  let languageId: string;
  let url: string;
  let translations: LanguageTranslation[];
  let translation: LanguageTranslationAttributes;
  let updateTranslations: LanguageTranslationAttributes[];

  beforeAll(async () => {
    languageId = suite.data.system.Language.id;
    url = `/api/admin/languages/${languageId}/translations`;

    translations = await ioc.cradle.languageService.getOrCreateLanguageTranslations(languageId);

    const source = translations.find(item => Object.values(item.messages).some(value => typeof value === 'string'))!;
    const key = Object.keys(source.messages).find(key => typeof source.messages[key] === 'string')!;

    translation = {
      ...source.get(),
      messages: {
        ...source.messages,
        [key]: 'new value',
      },
    };

    updateTranslations = [translation];
  });

  it('missing authentication / authorization', async () => {
    await suite.sharedTests.assert401and403('put', url, {
      input: { translations: updateTranslations },
      permissions,
    });
  });

  describe('authenticated / resource authorized', () => {
    beforeAll(async () => {
      await suite.util.setPermission(permissions);
    });

    it('should return 400 for missing input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['translations']);
    });

    it('should return 400 for invalid input data', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['translations'], {
        input: { translations: 'invalid-translation-object' },
      });
    });

    it('should return 400 for non-string message values', async () => {
      await suite.sharedTests.assertInvalidInput('put', url, ['translations.0.messages.nested', 'translations.0.messages.empty'], {
        input: {
          translations: [
            {
              id: translation.id,
              messages: {
                ...translation.messages,
                nested: { value: 1 },
                empty: null,
              },
            },
          ],
        },
      });
    });

    it('should drop message keys not present in default messages', async () => {
      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({
          translations: [
            {
              id: translation.id,
              messages: { ...translation.messages, unknownKey: 'value' },
            },
          ],
        });

      expect(status).toBe(200);

      const match = (body as any[]).find(item => item.id === translation.id);
      expect(match.messages).not.toHaveProperty('unknownKey');
    });

    it('should delete sections not present in default messages', async () => {
      const stale = await LanguageTranslation.create({
        languageId,
        application: 'admin',
        section: 'removed-section',
        messages: { title: 'Removed section' },
      });

      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({
          translations: [
            ...updateTranslations,
            { id: stale.id, messages: stale.messages },
          ],
        });

      expect(status).toBe(200);
      expect((body as any[]).find(item => item.id === stale.id)).toBeUndefined();
      expect(await LanguageTranslation.findByPk(stale.id)).toBeNull();
    });

    it('should return 200 and data', async () => {
      const { status, body } = await request(suite.app)
        .put(url)
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.user)
        .send({ translations: updateTranslations });

      expect(status).toBe(200);
      expect(body).toBeArray();
      expect(body).not.toBeEmpty();

      const match = (body as any[]).find(
        item =>
          item.application === translation.application && item.section === translation.section,
      );
      expect(match.messages).toStrictEqual(translation.messages);
    });
  });
};
