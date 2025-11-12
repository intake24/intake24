import type { StringValue } from 'ms';
import { formatDate } from 'date-fns/format';
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

/**
 * Generates a filename with a concise timestamp in YYYYMMDDHHmm format (e.g., file-20251112-1345.zip)
 */
export function getTimestampedFileName(baseName: string, extension: string): string {
  const timestamp = formatDate(new Date(), 'yyyyMMdd-HHmm');
  return `${baseName}-${timestamp}.${extension}`;
}
