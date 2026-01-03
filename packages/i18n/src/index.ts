import type { DefaultLocaleMessageSchema, LocaleMessageDictionary } from 'vue-i18n';
import { createI18n, useI18n as useI18nLib } from 'vue-i18n';

import type { Application } from '@intake24/common/types';

import { copy } from '@intake24/common/util';
import admin from './admin';
import api from './api';
import shared from './shared';
import survey from './survey';
import { createTranslate, createTranslatePath } from './util';

export { default as admin } from './admin';
export { default as api } from './api';
export { default as shared } from './shared';
export { default as survey } from './survey';
export * from './util';
export type { DefaultLocaleMessageSchema, LocaleMessageDictionary, LocaleMessageValue } from 'vue-i18n';

export const defaultI18nMessages = {
  admin: admin.en,
  api: api.en,
  shared: shared.en,
  survey: survey.en,
};

export type MessageSchema = typeof defaultI18nMessages;

const dateFormats = {
  recallDate: {
    month: 'short',
    day: 'numeric',
    weekday: 'long',
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

export const defaultMessages = {
  messages: {} as Record<string, DefaultLocaleMessageSchema>,

  getMessages(locale: string) {
    return this.messages[locale] || {};
  },

  setMessages(locale: string, newMessages: DefaultLocaleMessageSchema) {
    this.messages[locale] = copy(newMessages);
  },
};

export function useI18n() {
  const globalI18n = useI18nLib<DefaultLocaleMessageSchema, 'en' | string>({ useScope: 'global' });

  return {
    i18n: globalI18n,
    translate: createTranslate(globalI18n),
    translatePath: createTranslatePath(globalI18n),
  };
}

export async function loadAppLanguage(app: Application, lang: string, forceReload = false) {
  // @ts-expect-error - non-legacy is Ref
  if (!forceReload && (i18n.global.locale.value === lang || i18n.global.availableLocales.includes(lang)))
    return;

  await Promise.allSettled([
    import(`./${app}/${lang}/index.ts`),
    import(`./shared/${lang}/index.ts`),
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

export function getDefaultI18nMessages(language = 'en'): Record<string, LocaleMessageDictionary<any>> {
  return {
    admin: (admin as Record<string, DefaultLocaleMessageSchema>)[language] ?? admin.en,
    api: (api as Record<string, DefaultLocaleMessageSchema>)[language] ?? api.en,
    shared: (shared as Record<string, DefaultLocaleMessageSchema>)[language] ?? shared.en,
    survey: (survey as Record<string, DefaultLocaleMessageSchema>)[language] ?? survey.en,
  };
}
