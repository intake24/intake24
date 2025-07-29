import { customAlphabet, nanoid } from 'nanoid';
import { plural } from 'pluralize';
import slugify from 'slugify';

import { isSecurableType } from '../security';

export function capitalize(string: string): string {
  return string ? string[0].toUpperCase() + string.substring(1) : '';
}

/**
 * Convert string to kebab case
 *
 * @param {string} string
 */
export function kebabCase(string: string): string {
  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function modelToResource<T extends string>(modelType: T): string {
  return kebabCase(plural(modelType));
}

export function modelToRequestParam<T extends string>(modelType: T): string {
  return `${modelType[0].toLowerCase()}${modelType.substring(1)}Id`;
}

export function getResourceFromSecurable(securableType: any): string {
  if (!isSecurableType(securableType))
    throw new Error('Invalid securable type');

  return modelToResource(securableType);
}

export function getRequestParamFromSecurable(securableType: any): string {
  if (!isSecurableType(securableType))
    throw new Error('Invalid securable type');

  return `${securableType[0].toLowerCase()}${securableType.substring(1)}Id`;
}

/**
 * Generate random string with optional custom size / alphabet
 *
 * @param {number} size
 * @param {(string | null)} [alphabet]
 * @returns {string}
 */
export function randomString(size: number, alphabet?: string | null): string {
  if (!alphabet)
    return nanoid(size);

  return customAlphabet(alphabet, size)();
}

export function offsetToExcelColumn(offset: number | null): string | null {
  if (offset === null)
    return null;

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let currOffset = offset;

  while (currOffset > letters.length - 1) {
    const d = Math.floor(currOffset / letters.length) - 1;
    const rem = currOffset % letters.length;

    result = letters.charAt(rem) + result;
    currOffset = d;
  }

  return letters.charAt(currOffset) + result;
}

export function excelColumnToOffset(column: string): number {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const currColumn = column.toUpperCase();
  let result = 0;
  let f = 1;

  for (let i = currColumn.length - 1; i >= 0; i -= 1) {
    result += f * (letters.indexOf(currColumn.charAt(i)) + 1);
    f *= 26;
  }

  return result - 1;
}

/**
 * Convention helper for standard unit id
 *
 * @param {string} name
 * @returns {string}
 */
export function toStandardUnitId(name: string): string {
  return slugify(name, { replacement: '_', lower: true, strict: true });
}
