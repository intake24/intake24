import { jsonDateReviver } from './json';

describe('jsonDateReviver', () => {
  it('should convert ISO string to Date', () => {
    const res = jsonDateReviver('key', '2025-09-10T15:21:45Z');

    expect(res).toBeInstanceOf(Date);
    expect((res as Date).toISOString()).toBe('2025-09-10T15:21:45.000Z');
  });

  it('should convert ISO string to Date (ms)', () => {
    const res = jsonDateReviver('key', '2025-09-10T15:21:45.653Z');

    expect(res).toBeInstanceOf(Date);
    expect((res as Date).toISOString()).toBe('2025-09-10T15:21:45.653Z');
  });

  it('should keep rest as is', () => {
    const string = jsonDateReviver('key', 'value');
    const number = jsonDateReviver('key', 42);
    const object = jsonDateReviver('key', { a: 1 });
    const array = jsonDateReviver('key', [1, 2, 3]);
    const boolean = jsonDateReviver('key', true);
    const n = jsonDateReviver('key', null);
    const u = jsonDateReviver('key', undefined);

    expect(string).toBe('value');
    expect(number).toBe(42);
    expect(object).toEqual({ a: 1 });
    expect(array).toEqual([1, 2, 3]);
    expect(boolean).toBe(true);
    expect(n).toBeNull();
    expect(u).toBeUndefined();
  });
});
