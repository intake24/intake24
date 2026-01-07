import type { DefaultLocaleMessageSchema, LocaleMessageValue, useI18n } from 'vue-i18n';
import dompurify from 'dompurify';
import has from 'lodash/has';

import type {
  Dictionary,
  LocaleTranslation,
  RequiredLocaleTranslation,
} from '@intake24/common/types';
import { getObjectNestedKeys } from '@intake24/common/util';

/**
 * Merges two translations files together
 * - merge default built-in translation with database message object
 *
 * @param {*} defaults
 * @param {*} source
 * @returns
 */
export function mergeTranslations(defaults: any, source: any) {
  if (typeof defaults === 'undefined')
    return undefined;

  if (typeof source === 'undefined')
    return defaults;

  if (typeof defaults === 'string')
    return typeof source === 'string' ? source : defaults;

  if (Array.isArray(defaults))
    return Array.isArray(source) ? source : defaults;

  if (Object.prototype.toString.call(defaults) === '[object Object]') {
    return Object.keys(defaults).reduce<Record<string, any>>((acc, key) => {
      acc[key] = mergeTranslations(defaults[key], source[key]);
      return acc;
    }, {});
  }

  return undefined;
}

/**
 * Compares two translation messages objects if they same deeply nested keys
 *
 * @template T1
 * @template T2
 * @param {T1} x
 * @param {T2} y
 * @returns {boolean}
 */
export function compareMessageKeys<
  T1 extends LocaleMessageValue = LocaleMessageValue,
  T2 extends LocaleMessageValue = T1,
>(x: T1, y: T2): boolean {
  const xKeys = typeof x === 'string' ? [x] : getObjectNestedKeys(x);
  const yKeys = typeof y === 'string' ? [y] : getObjectNestedKeys(y);

  return xKeys.length === yKeys.length && xKeys.every(key => yKeys.includes(key));
}

/**
 * Check that input is either string | null | object
 *
 * @param {(string | Record<string, any>)} translation
 * @returns {boolean}
 */
export function validateTranslations(translation: string | Record<string, any>): boolean {
  if (Object.prototype.toString.call(translation) === '[object Object]') {
    for (const value of Object.values(translation)) {
      if (!validateTranslations(value))
        return false;
    }

    return true;
  }

  return typeof translation === 'string' || translation === null;
}

export type I18nParams = Record<
  string,
  string | string[] | readonly string[] | number | number[] | readonly number[]
>;

/**
 * Replace parameters in i18n message
 *
 * @param {string} message
 * @param {I18nParams} [params]
 */
export function replaceParams(message: string, params: I18nParams = {}) {
  return Object.entries(params).reduce((acc, [key, value]) => {
    acc = acc.replace(`{${key}}`, value.toString());
    return acc;
  }, message);
}

export type LocaleContentOptions = {
  path?: string;
  params?: Dictionary<string | number>;
  sanitize?: boolean;
  /**
   * Override the locale used for translation lookup.
   * Useful when i18n.locale.value hasn't been set yet but the target locale is known.
   */
  targetLocale?: string;
};

export function sanitizeParams(content: Dictionary<string | number>) {
  return Object.entries(content).reduce((acc, [key, value]) => {
    acc[key] = value = dompurify.sanitize(value.toString(), {
      USE_PROFILES: { mathMl: false, svg: false, svgFilters: false, html: false },
    });

    return acc;
  }, {} as Dictionary<string>);
}

/**
 * Maps complex locale codes to their database storage counterparts
 *
 * @param {string} localeCode
 * @returns {string}
 */
function mapLocaleCode(localeCode: string): string {
  // Map Japanese locale variants to database key
  if (localeCode.startsWith('jp') || localeCode.startsWith('ja') || localeCode.includes('JP')) {
    return 'ja';
  }

  return localeCode;
}

export function createTranslate(i18n: ReturnType<typeof useI18n<DefaultLocaleMessageSchema, 'en' | string>>) {
  return (
    content?: LocaleTranslation | RequiredLocaleTranslation | string,
    options: LocaleContentOptions = {},
  ) => {
    const { t, locale, messages } = i18n;
    const { path, sanitize = false, targetLocale } = options;
    let { params = {} } = options;

    if (sanitize)
      params = sanitizeParams(params as Dictionary<string | number>);

    if (typeof content === 'string')
      return replaceParams(content, params);

    // Use targetLocale if provided (for cases where i18n.locale hasn't been set yet)
    const mappedLocale = mapLocaleCode(targetLocale || locale.value);
    const localeContent = content ? content[mappedLocale] : undefined;

    if (localeContent)
      return replaceParams(localeContent, params);

    if (path && has(messages.value[locale.value], path))
      return t(path, params);

    const enContent = content?.en;
    if (enContent)
      return replaceParams(enContent, params);

    if (path && has(messages.value.en, path))
      return t(path, params);

    return '';
  };
}

export function createTranslatePath(i18n: ReturnType<typeof useI18n<DefaultLocaleMessageSchema, 'en' | string>>) {
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
