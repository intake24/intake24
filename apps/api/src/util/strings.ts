import { trim, trimEnd } from 'lodash-es';
import slugify from 'slugify';
import { UAParser } from 'ua-parser-js';
import validator from 'validator';

export const btoa = (object: any): string => Buffer.from(JSON.stringify(object)).toString('base64');
export function atob<T>(object: string): T {
  return JSON.parse(Buffer.from(object, 'base64').toString('utf-8'));
}

/**
 * Convention helper for user simple name
 *
 * @param {(string | null)} [name]
 * @returns {(string | null)}
 */
export function toSimpleName(name?: string | null): string | null {
  return name ? slugify(name, { replacement: ' ', lower: true }) : null;
}

/**
 * Check whether string is a BigInt
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isStringBigInt(value: any): boolean {
  if (typeof value === 'number' || typeof value === 'bigint')
    return true;

  if (typeof value !== 'string')
    return false;

  try {
    BigInt(value);
    return true;
  }
  catch {
    throw new Error('Value is not BigInt.');
  }
}

/**
 * Determine if URL is external (not relative)
 * covers both absolute URLs & IPs
 *
 * @param {string} url
 * @param {validator.IsURLOptions} options
 * @returns {boolean}
 */
export function isUrlAbsolute(url: string, options?: validator.IsURLOptions): boolean {
  return validator.isURL(url, { require_protocol: true, require_tld: false, ...options });
}

/**
 * Get frontend URL
 *
 * @param {string} base
 * @param {string} frontend
 * @param {string} [override]
 * @returns {string}
 */
export function getFrontEndUrl(base: string, frontend: string, override?: string | null): string {
  if (override)
    return trimEnd(override, '/');

  if (isUrlAbsolute(frontend))
    return trimEnd(frontend, '/');

  return [base, frontend].map(item => trim(item, '/')).join('/');
}

export function getAgentInfo(agent: { name?: string; version?: string }): string | undefined {
  return agent.name && agent.version ? `${agent.name} (${agent.version})` : undefined;
}

export function getUAInfo(userAgent?: string): string | undefined {
  const { browser, os } = UAParser(userAgent);
  return [browser, os].map(getAgentInfo).filter(Boolean).join(', ');
}

export function addDollarSign(str: string): string {
  if (str.charAt(0) !== '$')
    return `$${str}`;

  return str;
}
