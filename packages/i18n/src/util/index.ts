import type { LocaleMessageValue } from 'vue-i18n';

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
