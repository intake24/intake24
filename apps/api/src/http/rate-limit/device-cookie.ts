import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';

export type DeviceCookieOptions = {
  secret: string;
  maxAge: number;
  maxEntries: number;
};

type Entry = {
  deviceId: string;
  expiresAt: number;
  mac: string;
};

const entrySeparator = '~';
const fieldSeparator = '.';

function parse(value: string | undefined): Entry[] {
  if (!value)
    return [];

  return value.split(entrySeparator).flatMap((raw) => {
    const [deviceId, expiresAt, mac, ...rest] = raw.split(fieldSeparator);
    const expiry = Number(expiresAt);
    if (!deviceId || !mac || rest.length || !Number.isSafeInteger(expiry))
      return [];

    return [
      { deviceId, expiresAt: expiry, mac },
    ];
  });
}

function serialize(entries: Entry[]): string {
  return entries
    .map(({ deviceId, expiresAt, mac }) => [deviceId, expiresAt, mac].join(fieldSeparator))
    .join(entrySeparator);
}

/**
 * Device cookie marks a browser that has completed a full login to an account. It grants no
 * access by itself, it only selects which login rate limit buckets apply.
 *
 * The account key is not stored in the cookie, an entry is only valid when its MAC matches the
 * account key derived from the login request.
 */
export function deviceCookie({ secret, maxAge, maxEntries }: DeviceCookieOptions) {
  const key = Buffer.from(hkdfSync('sha256', secret, '', 'intake24-device-cookie', 32));

  const sign = (accountKey: string, deviceId: string, expiresAt: number) =>
    createHmac('sha256', key).update([accountKey, deviceId, expiresAt].join(fieldSeparator)).digest('base64url');

  const isValidFor = (entry: Entry, accountKey: string, now: number) => {
    if (entry.expiresAt <= now)
      return false;

    const expected = Buffer.from(sign(accountKey, entry.deviceId, entry.expiresAt));
    const actual = Buffer.from(entry.mac);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  };

  const find = (value: string | undefined, accountKey: string, now = Date.now()): string | undefined =>
    parse(value).slice(-maxEntries).find(entry => isValidFor(entry, accountKey, now))?.deviceId;

  /**
   * Adds a new entry for the account, replacing an existing one, and drops expired entries and
   * the oldest entries above the limit.
   */
  const issue = (value: string | undefined, accountKey: string, now = Date.now()): string => {
    const entries = parse(value).slice(-maxEntries).filter(entry => entry.expiresAt > now && !isValidFor(entry, accountKey, now));

    const deviceId = randomBytes(16).toString('base64url');
    const expiresAt = now + maxAge;
    entries.push({
      deviceId,
      expiresAt,
      mac: sign(accountKey, deviceId, expiresAt),
    });

    return serialize(entries.slice(-maxEntries));
  };

  return { find, issue };
}

export type DeviceCookie = ReturnType<typeof deviceCookie>;
