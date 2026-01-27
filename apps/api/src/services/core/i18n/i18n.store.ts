import type { IoC } from '@intake24/api/ioc';
import type { I18nParams } from '@intake24/i18n';

import { api, replaceParams, shared } from '@intake24/i18n';

export type TranslationObject = { [key: string]: TranslationObject } | string;

export type TranslationStore = {
  en: TranslationObject;
  [key: string]: TranslationObject;
};

function i18nStore({ logger: globalLogger, models }: Pick<IoC, 'logger' | 'models'>) {
  const logger = globalLogger.child({ service: 'I18nStore' });

  let store = api as TranslationStore;
  let availableLanguages = Object.keys(shared);

  /**
   * Reload i18n store
   *
   */
  const reload = async () => {
    const translations = await models.system.LanguageTranslation.findAll({
      include: [{ association: 'language', attributes: ['code'], required: true }],
      where: { application: 'api' },
    });

    const dbStore = translations.reduce<{ [key: string]: any }>((acc, item) => {
      const { section, messages, language } = item;
      if (!language)
        return acc;
      const code = language.code;

      if (!acc[code])
        acc[code] = {};

      if (!acc[code][section])
        acc[code][section] = {};

      acc[code][section] = messages;

      return acc;
    }, {});

    store = { ...store, ...dbStore };
    availableLanguages = [...new Set([...Object.keys(dbStore), ...Object.keys(shared)])];
  };

  /**
   * Initialize i18n store
   * - load built-in & database translations
   */
  const init = async () => {
    await reload();

    logger.info(`Store has been loaded.`);
  };

  const getAvailableLanguages = () => availableLanguages;
  const hasExactLanguage = (locale: string) => availableLanguages.includes(locale.toLowerCase());
  const hasLanguageWithSomeDialect = (locale: string) =>
    availableLanguages.find(l => l.toLowerCase().startsWith(locale.toLowerCase()));

  /**
   * Resolve dot-notation i18n object path
   *
   * @param {string} key
   * @param {string} locale
   * @returns
   */
  const resolvePath = (key: string, locale: string) => {
    const messages = store[locale] ?? store.en;

    const message = key.split('.').reduce((acc, seg) => {
      if (typeof acc === 'string')
        return acc;

      if (!acc[seg])
        return key;

      return acc[seg];
    }, messages);

    return message.toString();
  };

  const translate = (key: string, locale: string, params?: I18nParams) => {
    const message = resolvePath(key, locale);

    return params ? replaceParams(message, params) : message;
  };

  return {
    init,
    reload,
    getAvailableLanguages,
    translate,
    hasExactLanguage,
    hasLanguageWithSomeDialect,
  };
}

export default i18nStore;

export type I18nStore = ReturnType<typeof i18nStore>;
