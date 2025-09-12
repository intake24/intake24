import type { RequestIoC } from '@intake24/api/ioc';
import type { I18nParams } from '@intake24/i18n';

function i18nService({
  i18nStore,
  clientLanguages,
}: Pick<RequestIoC, 'i18nStore' | 'clientLanguages'>) {
  const translate = (key: string, params?: I18nParams) => {
    const availableLanguages = i18nStore.getAvailableLanguages();
    const accepted = clientLanguages.filter(lang => availableLanguages.includes(lang));
    const selectedLocale = accepted.length ? accepted[0] : 'en';

    return i18nStore.translate(key, selectedLocale, params);
  };

  return { translate };
}

export default i18nService;

export type I18nService = ReturnType<typeof i18nService>;
