import type { StringValue } from 'ms';

import ms from 'ms';

/**
 * Add time
 *
 * @param {(string | number)} offset time in `ms` format or milliseconds
 * @param {Date} [since]
 * @returns {Date}
 */
export function addTime(offset: StringValue | number, since: Date = new Date()): Date {
  return new Date(since.getTime() + (typeof offset === 'string' ? ms(offset) : offset));
}

/**
 * Subtract time
 *
 * @param {(string | number)} offset time in `ms` format or milliseconds
 * @param {Date} [since]
 * @returns {Date}
 */
export function subtractTime(offset: StringValue | number, since: Date = new Date()): Date {
  return new Date(since.getTime() - (typeof offset === 'string' ? ms(offset) : offset));
}

/**
 * Simple sleep/wait async helper
 *
 * @param {number} timeout
 * @returns {Promise<void>}
 */
export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
