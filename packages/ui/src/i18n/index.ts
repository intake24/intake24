import type { DefaultLocaleMessageSchema } from 'vue-i18n';
import { createI18n, useI18n as useI18nLib } from 'vue-i18n';
import type { Application } from '@intake24/common/types';
import { copy } from '@intake24/common/util';
import { createTranslate, createTranslatePath } from './util';

export * from './util';

const dateFormats = {
  recallDate: {
    month: 'short',
    day: 'numeric',
    weekday: 'long',
  },
};

export const defaultMessages = {
  messages: {} as Record<string, DefaultLocaleMessageSchema>,

  getMessages(locale: string) {
    return this.messages[locale] || {};
  },

  setMessages(locale: string, newMessages: DefaultLocaleMessageSchema) {
    this.messages[locale] = copy(newMessages);
  },
};

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  datetimeFormats: {
    // @ts-expect-error - i18n types
    en: dateFormats,
  },
  legacy: false,
});

export function useI18n() {
  const globalI18n = useI18nLib<DefaultLocaleMessageSchema, 'en' | string>({ useScope: 'global' });

  return {
    i18n: globalI18n,
    translate: createTranslate(globalI18n),
    translatePath: createTranslatePath(globalI18n),
  };
}

export async function loadAppLanguage(app: Application, lang: string) {
  // @ts-expect-error - non-legacy is Ref
  if (i18n.global.locale.value === lang || i18n.global.availableLocales.includes(lang))
    return;

  await Promise.allSettled([
    import(`../../../i18n/src/${app}/${lang}/index.ts`),
    import(`../../../i18n/src/shared/${lang}/index.ts`),
  ]).then(([app, shared]) => {
    if (app.status !== 'fulfilled' || shared.status !== 'fulfilled')
      return;

    i18n.global.setLocaleMessage(lang, { ...app.value.default, ...shared.value.default });
    i18n.global.setDateTimeFormat(lang, dateFormats);
    defaultMessages.setMessages(lang, { ...app.value.default, ...shared.value.default });
  });
}

export const loadAdminLanguage = async (lang: string) => loadAppLanguage('admin', lang);

export const loadSurveyLanguage = async (lang: string) => loadAppLanguage('survey', lang);
