import type { DefaultLocaleMessageSchema, LocaleMessageDictionary } from 'vue-i18n';
import admin from './admin';
import api from './api';
import shared from './shared';
import survey from './survey';

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

export function getDefaultI18nMessages(language = 'en'): Record<string, LocaleMessageDictionary<any>> {
  return {
    admin: (admin as Record<string, DefaultLocaleMessageSchema>)[language] ?? admin.en,
    api: (api as Record<string, DefaultLocaleMessageSchema>)[language] ?? api.en,
    shared: (shared as Record<string, DefaultLocaleMessageSchema>)[language] ?? shared.en,
    survey: (survey as Record<string, DefaultLocaleMessageSchema>)[language] ?? survey.en,
  };
}
