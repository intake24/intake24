import type { DefaultLocaleMessageSchema } from 'vue-i18n';

import type { Dictionary, LocaleTranslation, RequiredLocaleTranslation } from '@intake24/common/types';

import dompurify from 'dompurify';
import { has } from 'lodash-es';
import { useI18n as useI18nLib } from 'vue-i18n';

import { replaceParams } from '@intake24/i18n';

export type LocaleContentOptions = {
  path?: string;
  params?: Dictionary<string | number>;
  sanitize?: boolean;
  force?: boolean;
};

export function sanitizeParams(content: Dictionary<string | number>) {
  return Object.entries(content).reduce((acc, [key, value]) => {
    acc[key] = value = dompurify.sanitize(value.toString(), {
      USE_PROFILES: { mathMl: false, svg: false, svgFilters: false, html: false },
    });

    return acc;
  }, {} as Dictionary<string>);
}

export function createTranslate(i18n: ReturnType<typeof useI18nLib<DefaultLocaleMessageSchema, 'en' | string>>) {
  return (
    content?: LocaleTranslation | RequiredLocaleTranslation | string,
    options: LocaleContentOptions = {},
  ) => {
    const { t, locale, messages } = i18n;
    const { path, sanitize = false, force = false } = options;
    let { params = {} } = options;

    if (sanitize)
      params = sanitizeParams(params as Dictionary<string | number>);

    if (typeof content === 'string')
      return replaceParams(content, params);

    const localeContent = content ? content[locale.value] : undefined;
    if (localeContent)
      return replaceParams(localeContent, params);

    if (path && has(messages.value[locale.value], path))
      return t(path, params);

    const enContent = content?.en;
    if (enContent)
      return replaceParams(enContent, params);

    if (path && has(messages.value.en, path))
      return t(path, params);

    return force ? replaceParams(Object.values(content ?? {}).at(0) || '', params) : '';
  };
}

export function createTranslatePath(i18n: ReturnType<typeof useI18nLib<DefaultLocaleMessageSchema, 'en' | string>>) {
  return (
    path: string,
    params: Dictionary<string | number> = {},
    sanitize: boolean = false,
  ) => {
    const { t } = i18n;

    if (sanitize)
      params = sanitizeParams(params as Dictionary<string | number>);
    return t(path, params);
  };
}
