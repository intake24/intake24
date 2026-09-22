import { NotFoundError, ServiceTimeoutError, ServiceUnavailableError } from '@intake24/api/http/errors';

import { createHarness, createTestLogger, searchParams, searchResults } from './helpers/harness';

const db = vi.hoisted(() => ({
  /** null means every requested locale exists. */
  existingLocales: null as string[] | null,
}));

vi.mock(import('@intake24/db'), async importOriginal => ({
  ...(await importOriginal()),
  FoodsLocale: {
    findAll: vi.fn(async ({ where }: any) => {
      const requested: string[] = where?.id ?? [];

      return requested
        .filter(id => db.existingLocales === null || db.existingLocales.includes(id))
        .map(id => ({ id }));
    }),
  } as any,
}));

type Harness = Awaited<ReturnType<typeof createHarness>>;

describe('foodIndex', () => {
  const harnesses = new Array<Harness>();

  async function harness(...args: Parameters<typeof createHarness>) {
    const created = await createHarness(...args);
    harnesses.push(created);

    return created;
  }

  beforeEach(() => {
    db.existingLocales = null;
  });

  afterEach(async () => {
    await Promise.all(harnesses.splice(0).map(h => h.dispose()));
    vi.useRealTimers();
  });

  describe('worker message dispatch', () => {
    it('does not add a worker listener per request', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      const before = h.worker.listenerCount('message');

      for (let i = 0; i < 3; i++) {
        const search = h.foodIndex.search(searchParams('en_GB'));
        const request = await h.nextRequestOfType('search');
        h.respond({ type: 'search', id: request.id, success: true, results: searchResults('apple') });
        await search;
      }

      for (let i = 0; i < 2; i++) {
        await h.foodIndex.queueRebuild(['en_GB']);
        const request = await h.nextRequestOfType('rebuild');
        await h.completeRebuild(request.id, ['en_GB']);
      }

      expect(h.worker.listenerCount('message')).toBe(before);
    });

    it('routes concurrent searches to their own callers regardless of response order', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      const first = h.foodIndex.search(searchParams('en_GB', 'one'));
      const firstRequest = await h.nextRequestOfType('search');
      const second = h.foodIndex.search(searchParams('en_GB', 'two'));
      const secondRequest = await h.nextRequestOfType('search');
      const third = h.foodIndex.search(searchParams('en_GB', 'three'));
      const thirdRequest = await h.nextRequestOfType('search');

      h.respond({ type: 'search', id: thirdRequest.id, success: true, results: searchResults('three') });
      h.respond({ type: 'search', id: firstRequest.id, success: true, results: searchResults('one') });
      h.respond({ type: 'search', id: secondRequest.id, success: true, results: searchResults('two') });

      expect((await first).foods[0].name).toBe('one');
      expect((await second).foods[0].name).toBe('two');
      expect((await third).foods[0].name).toBe('three');
    });

    it('logs a warning for a response that has no pending request', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      h.respond({ type: 'search', id: 999, success: true, results: searchResults('ghost') });
      await h.awaitDispatched(msg => msg.type === 'search' && msg.id === 999);

      expect(h.logMessages('warn').some(message => message.includes('999'))).toBe(true);
    });

    it('logs a mismatch and leaves the search pending when a response has the wrong type', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      const search = h.foodIndex.search(searchParams('en_GB'));
      const request = await h.nextRequestOfType('search');

      h.respond({ type: 'rebuild', id: request.id, success: true, results: [], enabledLocales: ['en_GB'] });
      await h.awaitDispatched(msg => msg.type === 'rebuild');

      expect(h.logMessages('error').some(message => message.includes('mismatch'))).toBe(true);

      // The search was neither resolved nor rejected by the mismatched response.
      h.respond({ type: 'search', id: request.id, success: true, results: searchResults('apple') });
      await expect(search).resolves.toMatchObject({ foods: [{ name: 'apple' }] });
    });

    it('logs an error for an unrecognised message type', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      h.respond({ type: 'nonsense' } as any);
      await h.awaitDispatched(msg => (msg as any).type === 'nonsense');

      expect(h.logMessages('error').some(message => message.includes('Unexpected message'))).toBe(true);
    });
  });

  describe('search timeouts', () => {
    it('rejects with a timeout error when the worker never responds', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      vi.useFakeTimers();

      const search = h.foodIndex.search(searchParams('en_GB'));
      await h.nextRequestOfType('search');

      const rejection = expect(search).rejects.toBeInstanceOf(ServiceTimeoutError);
      await vi.advanceTimersByTimeAsync(10000);
      await rejection;
    });

    it('cancels the timeout when the response arrives first', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      vi.useFakeTimers();

      const search = h.foodIndex.search(searchParams('en_GB'));
      const request = await h.nextRequestOfType('search');
      h.respond({ type: 'search', id: request.id, success: true, results: searchResults('apple') });

      await expect(search).resolves.toBeDefined();

      await vi.advanceTimersByTimeAsync(20000);

      expect(h.logMessages('error')).toEqual([]);
    });
  });

  describe('initialisation', () => {
    it('rejects searches with 503 while the initial build is running', async () => {
      const h = await harness();

      await expect(h.foodIndex.search(searchParams('en_GB'))).rejects.toBeInstanceOf(ServiceUnavailableError);
    });

    it('rejects searches with 503 for a locale that is still being indexed', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['en_AU']);
      await h.nextRequestOfType('rebuild');

      await expect(h.foodIndex.search(searchParams('en_AU'))).rejects.toBeInstanceOf(ServiceUnavailableError);
    });

    it('keeps other locales usable when one locale fails to build', async () => {
      const h = await harness();
      await h.ready(['en_GB', 'en_AU'], [
        { localeId: 'en_GB', success: true },
        { localeId: 'en_AU', success: false, error: new Error('en_AU build failed') },
      ]);

      const failed = await h.foodIndex.search(searchParams('en_AU')).catch(error => error);
      expect(failed.message).toContain('failed state');
      expect(failed).not.toBeInstanceOf(ServiceUnavailableError);
      expect(failed).not.toBeInstanceOf(NotFoundError);

      const search = h.foodIndex.search(searchParams('en_GB'));
      const request = await h.nextRequestOfType('search');
      h.respond({ type: 'search', id: request.id, success: true, results: searchResults('apple') });

      await expect(search).resolves.toMatchObject({ foods: [{ name: 'apple' }] });
    });

    it('marks a locale that returned no build result as failed', async () => {
      const h = await harness();
      await h.ready(['en_GB', 'en_AU'], [{ localeId: 'en_GB', success: true }]);

      await expect(h.foodIndex.search(searchParams('en_AU'))).rejects.toThrow('failed state');
      expect(h.logMessages('error').some(message => message.includes('en_AU'))).toBe(true);
    });
  });

  describe('worker failure', () => {
    it('rejects in-flight and subsequent searches when the worker crashes', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      const inFlight = h.foodIndex.search(searchParams('en_GB'));
      await h.nextRequestOfType('search');

      const rejection = expect(inFlight).rejects.toThrow('Food index worker failed');
      h.crashWorker();
      await rejection;

      await expect(h.foodIndex.search(searchParams('en_GB'))).rejects.toThrow('worker has failed');
    });

    it('fails the index when the worker exits unexpectedly', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      h.exitWorker(1);
      await h.awaitWorkerFailure();

      await expect(h.foodIndex.search(searchParams('en_GB'))).rejects.toThrow('worker has failed');
    });

    it('fails the index when the worker dies during bootstrap', async () => {
      const h = await harness({ scenario: 'crashOnBoot' });

      await h.awaitWorkerFailure();

      await expect(h.foodIndex.search(searchParams('en_GB'))).rejects.toThrow('worker has failed');
      expect(h.logMessages('error').some(message => message.includes('simulated fatal bootstrap failure'))).toBe(true);
    });

    it('refuses to queue a rebuild after the worker has failed', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      h.exitWorker(1);
      await h.awaitWorkerFailure();

      await h.foodIndex.queueRebuild(['en_GB']);

      expect(h.logMessages('error').some(message => message.includes('worker has failed'))).toBe(true);
    });
  });

  describe('rebuild coalescing', () => {
    it('dispatches a single rebuild when the worker is idle', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const request = await h.nextRequestOfType('rebuild');
      expect(request.locales).toEqual(['en_GB']);

      await h.completeRebuild(request.id, ['en_GB']);
      await h.assertNoFurtherRequests();
    });

    it('coalesces duplicate requests received during a rebuild into one follow-up', async () => {
      const h = await harness();
      await h.ready(['en_GB', 'en_AU']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const first = await h.nextRequestOfType('rebuild');

      await h.foodIndex.queueRebuild(['en_AU']);
      await h.foodIndex.queueRebuild(['en_AU']);
      await h.foodIndex.queueRebuild(['en_AU']);

      await h.completeRebuild(first.id, ['en_GB', 'en_AU']);

      const second = await h.nextRequestOfType('rebuild');
      expect(second.locales).toEqual(['en_AU']);

      await h.completeRebuild(second.id, ['en_GB', 'en_AU']);
      await h.assertNoFurtherRequests();
    });

    it('does not lose a change arriving for the locale currently being rebuilt', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const first = await h.nextRequestOfType('rebuild');

      // The data changed again after the in-flight rebuild read it.
      await h.foodIndex.queueRebuild(['en_GB']);

      await h.completeRebuild(first.id, ['en_GB']);

      const second = await h.nextRequestOfType('rebuild');
      expect(second.locales).toEqual(['en_GB']);
    });

    it('holds rebuilds requested before initialisation and dispatches them as one', async () => {
      const h = await harness();

      await h.foodIndex.queueRebuild(['en_GB']);
      await h.foodIndex.queueRebuild(['en_GB']);
      await h.foodIndex.queueRebuild(['en_AU']);

      await h.ready(['en_GB', 'en_AU']);

      const request = await h.nextRequestOfType('rebuild');
      expect([...(request.locales ?? [])].sort()).toEqual(['en_AU', 'en_GB']);

      await h.completeRebuild(request.id, ['en_GB', 'en_AU']);
      await h.assertNoFurtherRequests();
    });

    it('lets a rebuild-everything request supersede queued per-locale requests', async () => {
      const h = await harness();
      await h.ready(['en_GB', 'en_AU']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const first = await h.nextRequestOfType('rebuild');

      await h.foodIndex.queueRebuild(['en_AU']);
      await h.foodIndex.queueRebuild();

      await h.completeRebuild(first.id, ['en_GB', 'en_AU']);

      const second = await h.nextRequestOfType('rebuild');
      expect(second.locales).toBeUndefined();

      await h.completeRebuild(second.id, ['en_GB', 'en_AU']);
      await h.assertNoFurtherRequests();
    });

    it('does not dispatch anything when nothing is queued', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.assertNoFurtherRequests();
    });

    it('ignores a rebuild request for a locale that does not exist', async () => {
      db.existingLocales = [];

      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['does-not-exist']);

      expect(h.logMessages('warn').some(message => message.includes('does-not-exist'))).toBe(true);
      await h.assertNoFurtherRequests();
    });
  });

  describe('rebuild failure handling', () => {
    it('does not reject pending searches when a locale fails to rebuild', async () => {
      const h = await harness();
      await h.ready(['en_GB', 'en_AU']);

      const pending = h.foodIndex.search(searchParams('en_AU'));
      const searchRequest = await h.nextRequestOfType('search');

      await h.foodIndex.queueRebuild(['en_GB']);
      const rebuildRequest = await h.nextRequestOfType('rebuild');

      await h.completeRebuild(rebuildRequest.id, ['en_GB', 'en_AU'], [
        { localeId: 'en_GB', success: false, error: new Error('rebuild failed') },
      ]);

      h.respond({ type: 'search', id: searchRequest.id, success: true, results: searchResults('still works') });
      await expect(pending).resolves.toMatchObject({ foods: [{ name: 'still works' }] });
    });

    it('keeps serving the previous index when a rebuild fails for a ready locale', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const request = await h.nextRequestOfType('rebuild');

      await h.completeRebuild(request.id, ['en_GB'], [
        { localeId: 'en_GB', success: false, error: new Error('rebuild failed') },
      ]);

      const search = h.foodIndex.search(searchParams('en_GB'));
      const searchRequest = await h.nextRequestOfType('search');
      h.respond({ type: 'search', id: searchRequest.id, success: true, results: searchResults('apple') });

      await expect(search).resolves.toMatchObject({ foods: [{ name: 'apple' }] });
    });

    it('recovers from a rebuild that failed before it could read the enabled locales', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const first = await h.nextRequestOfType('rebuild');

      await h.failRebuild(first.id, new Error('could not read enabled locales'));

      expect(h.logMessages('error')).toContain('could not read enabled locales');

      // Locale states are untouched, so the previous index is still searchable...
      const search = h.foodIndex.search(searchParams('en_GB'));
      const searchRequest = await h.nextRequestOfType('search');
      h.respond({ type: 'search', id: searchRequest.id, success: true, results: searchResults('apple') });
      await expect(search).resolves.toBeDefined();

      // ...and the failure did not wedge the rebuild pipeline.
      await h.foodIndex.queueRebuild(['en_GB']);
      const second = await h.nextRequestOfType('rebuild');
      expect(second.locales).toEqual(['en_GB']);
    });
  });

  describe('enabled locale reconciliation', () => {
    it('drops a locale that is no longer enabled and reports it as not found', async () => {
      const h = await harness();
      await h.ready(['en_GB', 'en_AU']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const request = await h.nextRequestOfType('rebuild');

      // en_AU is missing from the authoritative list, so its index is gone.
      await h.completeRebuild(request.id, ['en_GB'], [{ localeId: 'en_GB', success: true }]);

      await expect(h.foodIndex.search(searchParams('en_AU'))).rejects.toBeInstanceOf(NotFoundError);
      expect(h.logMessages('warn').some(message => message.includes('en_AU'))).toBe(true);
    });

    it('makes a newly enabled locale searchable without it being queued', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await h.foodIndex.queueRebuild(['en_GB']);
      const request = await h.nextRequestOfType('rebuild');

      await h.completeRebuild(request.id, ['en_GB', 'en_AU'], [
        { localeId: 'en_GB', success: true },
        { localeId: 'en_AU', success: true },
      ]);

      const search = h.foodIndex.search(searchParams('en_AU'));
      const searchRequest = await h.nextRequestOfType('search');
      h.respond({ type: 'search', id: searchRequest.id, success: true, results: searchResults('pavlova') });

      await expect(search).resolves.toMatchObject({ foods: [{ name: 'pavlova' }] });
    });
  });

  describe('error mapping across the worker boundary', () => {
    it('reports a missing locale index as not found', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      const search = h.foodIndex.search(searchParams('en_GB'));
      const request = await h.nextRequestOfType('search');

      h.respond({
        type: 'search',
        id: request.id,
        success: false,
        errorType: 'locale-not-indexed',
        error: new NotFoundError('Locale en_GB does not exist or is not enabled'),
      });

      await expect(search).rejects.toBeInstanceOf(NotFoundError);
    });

    it('relies on the error tag rather than the error class, which structured cloning discards', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      const search = h.foodIndex.search(searchParams('en_GB'));
      const request = await h.nextRequestOfType('search');

      // A NotFoundError tagged as internal: if the class survived cloning this would be a NotFoundError.
      h.respond({
        type: 'search',
        id: request.id,
        success: false,
        errorType: 'internal',
        error: new NotFoundError('class identity is lost in transit'),
      });

      const error = await search.catch(caught => caught);
      expect(error).not.toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('class identity is lost in transit');
    });

    it('reports an unknown locale as not found', async () => {
      const h = await harness();
      await h.ready(['en_GB']);

      await expect(h.foodIndex.search(searchParams('never-heard-of-it'))).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('service wiring', () => {
    it('logs through a child logger scoped to the food index', async () => {
      const { logger } = createTestLogger();
      const child = vi.spyOn(logger, 'child');

      const { FoodIndex } = await import('@intake24/api/food-index');
      // eslint-disable-next-line no-new
      new FoodIndex({ logger } as any);

      expect(child).toHaveBeenCalledWith({ service: 'FoodIndex' });
    });

    it('is a single shared instance across the container', async () => {
      const ioc = (await import('@intake24/api/ioc')).default;

      expect(ioc.cradle.foodIndex).toBe(ioc.cradle.foodIndex);
    });
  });
});
