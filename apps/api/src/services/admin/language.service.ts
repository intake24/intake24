import type { IoC } from '@intake24/api/ioc';
import type { Application } from '@intake24/common/types';
import type {
  LanguageRequest,
  LanguageTranslationAttributes,
  UpdateLanguageRequest,
} from '@intake24/common/types/http/admin';
import type {
  LanguageTranslationCreationAttributes,
  WhereOptions,
} from '@intake24/db';

import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { Language, LanguageTranslation } from '@intake24/db';
import { compareMessageKeys, getDefaultI18nMessages, mergeTranslations } from '@intake24/i18n';

function languageService({
  i18nStore,
  logger: globalLogger,
}: Pick<IoC, 'i18nStore' | 'logger'>) {
  const logger = globalLogger.child({ service: 'LanguageService' });

  /**
   * Get the in-code language for initialization (en or any other existing language)
   *
   * @param {string} languageId
   * @returns
   */
  const languageForInitialization = async (
    languageId: string,
  ) => {
    const language = await Language.findByPk(languageId, { attributes: ['id', 'code'] });
    if (!language)
      return getDefaultI18nMessages();

    // 1.: check if the exact match for the language exists in the code (without the dialect)
    if (i18nStore.hasExactLanguage(language.code.toLowerCase()))
      return getDefaultI18nMessages(language.code);

    const [languageCode] = language.code.toLowerCase().split(/[-_]/);
    if (!languageCode)
      return getDefaultI18nMessages();

    // 2.: check if the language exists in the code (without the dialect)
    if (i18nStore.hasExactLanguage(languageCode))
      return getDefaultI18nMessages(languageCode);

    // 3.: check if the language exists in the code (with some other dialect). Picking the first one
    const languageWithDialect = i18nStore.hasLanguageWithSomeDialect(languageCode);
    if (languageWithDialect)
      return getDefaultI18nMessages(languageWithDialect);

    return getDefaultI18nMessages();
  };

  /**
   * Get language record with messages
   *
   * @param {string} languageId
   * @returns {Promise<Language>}
   */
  const getLanguage = async (languageId: string): Promise<Language> => {
    const language = await Language.findByPk(languageId);
    if (!language)
      throw new NotFoundError();

    return language;
  };

  /**
   * Get language translations set
   *
   * @param {string} languageId
   * @returns {Promise<LanguageTranslation[]>}
   */
  const getLanguageTranslations = async (languageId: string): Promise<LanguageTranslation[]> =>
    LanguageTranslation.findAll({
      where: { languageId },
      order: [
        ['application', 'ASC'],
        ['section', 'ASC'],
      ],
    });

  /**
   * Initialize language translations set
   *
   * @param {string} languageId
   * @returns {Promise<void>}
   */
  const createLanguageTranslations = async (languageId: string, reload = false): Promise<void> => {
    const languageMessagesForInitialization = await languageForInitialization(languageId);

    const languageMessages: LanguageTranslationCreationAttributes[] = Object.entries(
      languageMessagesForInitialization,
    )
      .map(([application, messages]) =>
        Object.keys(messages).map(section => ({
          languageId,
          application: application as Application,
          section,
          messages: messages[section],
        })),
      )
      .flat();

    if (languageMessages.length)
      await LanguageTranslation.bulkCreate(languageMessages);

    if (reload)
      await i18nStore.reload();
  };

  /**
   * Get or initialize language translations set
   *
   * @param {string} languageId
   * @returns {Promise<LanguageTranslation[]>}
   */
  const getOrCreateLanguageTranslations = async (
    languageId: string,
  ): Promise<LanguageTranslation[]> => {
    const translations = await getLanguageTranslations(languageId);
    if (translations.length)
      return translations;

    await createLanguageTranslations(languageId, true);

    return getLanguageTranslations(languageId);
  };

  /**
   * Create language with messages
   *
   * @param {LanguageRequest} input
   * @param {string} ownerId
   * @returns {Promise<Language>}
   */
  const createLanguage = async (input: LanguageRequest, ownerId: string): Promise<Language> => {
    const language = await Language.create({ ...input, ownerId });

    return language;
  };

  /**
   * Update language
   *
   * @param {(string | Language)} languageId
   * @param {UpdateLanguageRequest} input
   * @returns {Promise<Language>}
   */
  const updateLanguage = async (
    languageId: string | Language,
    input: UpdateLanguageRequest,
  ): Promise<Language> => {
    const language
      = typeof languageId === 'string' ? await Language.findByPk(languageId) : languageId;

    if (!language)
      throw new NotFoundError();

    await language.update(input);

    return language;
  };

  /**
   * Delete language
   *
   * @param {string} languageId
   * @returns {Promise<void>}
   */
  const deleteLanguage = async (languageId: string): Promise<void> => {
    const language = await Language.scope(['adminLocales', 'surveyLocales']).findByPk(languageId, {
      attributes: ['id'],
    });
    if (!language || !language.adminLocales || !language.surveyLocales)
      throw new NotFoundError();

    if (language.adminLocales.length || language.surveyLocales.length) {
      throw new ForbiddenError(
        'Language cannot be deleted. There are locales using this language.',
      );
    }

    await language.destroy();
  };

  /**
   * Update language translations set
   *
   * @param {string} languageId
   * @param {LanguageTranslationAttributes[]} inputs
   * @returns {Promise<LanguageTranslation[]>}
   */
  const updateLanguageTranslations = async (
    languageId: string,
    inputs: Pick<LanguageTranslationAttributes, 'id' | 'messages'>[],
  ): Promise<LanguageTranslation[]> => {
    const language = await Language.findByPk(languageId, {
      include: [
        {
          association: 'translations',
          order: [
            ['application', 'ASC'],
            ['section', 'ASC'],
          ],
          separate: true,
        },
      ],
    });
    if (!language)
      throw new NotFoundError();

    const { translations } = language;

    if (!translations?.length)
      return [];

    for (const translation of translations) {
      const match = inputs.find(input => input.id === translation.id);
      if (!match)
        continue;

      const { messages } = match;

      await translation.update({ messages });
    }

    await i18nStore.reload();

    return translations;
  };

  /**
   * Delete language translations set
   *
   * @param {string} languageId
   * @returns {Promise<void>}
   */
  const deleteLanguageTranslations = async (languageId: string): Promise<void> => {
    await LanguageTranslation.destroy({ where: { languageId } });
    await i18nStore.reload();
  };

  /**
   * Synchronize language translations
   * - inserts missing sections
   * - merges current translations with default ones
   *
   * @param {(string | string[])} [id]
   * @returns {Promise<void>}
   */
  const syncLanguageTranslations = async (id?: string | string[]): Promise<void> => {
    const where: WhereOptions<LanguageTranslationAttributes> = {};
    if (id)
      where.id = id;

    const languages = await Language.findAll({ where, include: [{ association: 'translations' }] });
    if (!languages.length)
      return;

    for (const language of languages) {
      if (!language.translations)
        throw new NotFoundError();

      const { id: languageId, code, translations } = language;

      // Translations are not initialized for the language
      if (!translations.length)
        continue;

      const inserts: LanguageTranslationCreationAttributes[] = [];
      const promises: PromiseLike<any>[] = [];
      // added check for existing languages with the same code in the source code
      // const languageMessagesForInitialization = await languageForInitialization(languageId);

      const defaultLangMessages = getDefaultI18nMessages(code);
      for (const [app, appMessages] of Object.entries(defaultLangMessages)) {
        const application = app as Application;

        for (const [section, messages] of Object.entries(appMessages)) {
          const translation = translations.find(
            item => item.application === application && item.section === section,
          );

          if (!translation) {
            inserts.push({ languageId, application, section, messages });

            logger.debug(`Creating language messages for '${application}:${section}'.`);
            continue;
          }

          if (compareMessageKeys(messages, translation.messages))
            continue;

          promises.push(
            translation.update({ messages: mergeTranslations(messages, translation.messages) }),
          );
          logger.debug(`Updating language messages for '${application}:${section}'.`);
        }
      }

      if (inserts.length)
        promises.push(LanguageTranslation.bulkCreate(inserts));

      if (promises.length)
        await Promise.all(promises);
    }

    await i18nStore.reload();
  };

  return {
    getLanguage,
    createLanguage,
    updateLanguage,
    deleteLanguage,
    createLanguageTranslations,
    getLanguageTranslations,
    getOrCreateLanguageTranslations,
    updateLanguageTranslations,
    deleteLanguageTranslations,
    syncLanguageTranslations,
  };
}

export default languageService;

export type LanguageService = ReturnType<typeof languageService>;
