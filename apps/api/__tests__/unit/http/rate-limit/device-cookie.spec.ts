import { deviceCookie } from '@intake24/api/http/rate-limit';

describe('device cookie', () => {
  const now = 1_700_000_000_000;
  const maxAge = 60_000;
  const cookie = deviceCookie({ secret: 'aTestSecret', maxAge, maxEntries: 2 });

  it('should find entry issued for the account', () => {
    const value = cookie.issue(undefined, 'account-a', now);

    expect(cookie.find(value, 'account-a', now)).toBeString();
  });

  it('should not find entry for a different account', () => {
    const value = cookie.issue(undefined, 'account-a', now);

    expect(cookie.find(value, 'account-b', now)).toBeUndefined();
  });

  it('should not find expired entry', () => {
    const value = cookie.issue(undefined, 'account-a', now);

    expect(cookie.find(value, 'account-a', now + maxAge)).toBeUndefined();
  });

  it('should not find entry signed with a different secret', () => {
    const value = deviceCookie({ secret: 'anotherSecret', maxAge, maxEntries: 2 }).issue(undefined, 'account-a', now);

    expect(cookie.find(value, 'account-a', now)).toBeUndefined();
  });

  it('should not find tampered entry', () => {
    const [deviceId, , mac] = cookie.issue(undefined, 'account-a', now).split('.');
    const extended = [deviceId, now + 10 * maxAge, mac].join('.');

    expect(cookie.find(extended, 'account-a', now)).toBeUndefined();
  });

  it.each([
    undefined,
    '',
    'garbage',
    '..',
    'a.b.c',
    'a.1.c.d',
  ])('should ignore malformed value %#', (value) => {
    expect(cookie.find(value, 'account-a', now)).toBeUndefined();
    expect(cookie.find(cookie.issue(value, 'account-a', now), 'account-a', now)).toBeString();
  });

  it('should keep entries for multiple accounts', () => {
    const value = cookie.issue(cookie.issue(undefined, 'account-a', now), 'account-b', now);

    expect(cookie.find(value, 'account-a', now)).toBeString();
    expect(cookie.find(value, 'account-b', now)).toBeString();
  });

  it('should replace existing entry for the same account', () => {
    const first = cookie.issue(undefined, 'account-a', now);
    const second = cookie.issue(first, 'account-a', now);

    expect(second.split('~')).toHaveLength(1);
    expect(cookie.find(second, 'account-a', now)).not.toBe(cookie.find(first, 'account-a', now));
  });

  it('should drop the oldest entry above the limit', () => {
    let value = cookie.issue(undefined, 'account-a', now);
    value = cookie.issue(value, 'account-b', now);
    value = cookie.issue(value, 'account-c', now);

    expect(cookie.find(value, 'account-a', now)).toBeUndefined();
    expect(cookie.find(value, 'account-b', now)).toBeString();
    expect(cookie.find(value, 'account-c', now)).toBeString();
  });

  it('should drop expired entries when issuing', () => {
    const value = cookie.issue(cookie.issue(undefined, 'account-a', now), 'account-b', now + maxAge);

    expect(value.split('~')).toHaveLength(1);
  });
});
