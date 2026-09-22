import type { MessagePort, Worker } from 'node:worker_threads';

import type { SearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { LocaleBuildResult, WorkerRequest, WorkerResponse } from '@intake24/api/food-index/worker-protocol';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import { fileURLToPath } from 'node:url';
import { MessageChannel, Worker as NodeWorker } from 'node:worker_threads';

import { FoodIndex } from '@intake24/api/food-index';
import { applyDefaultSearchQueryParameters } from '@intake24/api/food-index/search-query';

const stubWorkerPath = fileURLToPath(new URL('./stub-worker.mjs', import.meta.url));

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface TestLogger {
  child: () => TestLogger;
  error: (message: unknown) => void;
  warn: (message: unknown) => void;
  info: (message: unknown) => void;
  debug: (message: unknown) => void;
}

export function createTestLogger() {
  const entries = new Array<{ level: LogLevel; message: unknown }>();

  const record = (level: LogLevel) => (message: unknown) => {
    entries.push({ level, message });
  };

  const logger: TestLogger = {
    child: () => logger,
    error: record('error'),
    warn: record('warn'),
    info: record('info'),
    debug: record('debug'),
  };

  return {
    logger,
    entries,
    /** Logged messages at the given level, as strings (Error instances become their message). */
    messages: (level: LogLevel) => entries
      .filter(entry => entry.level === level)
      .map(({ message }) => (message instanceof Error ? message.message : String(message))),
  };
}

/** FoodIndex wired to the stub worker instead of the real index builder. */
class StubbedFoodIndex extends FoodIndex {
  public createdWorker!: Worker;

  private readonly controlPort: MessagePort;
  private readonly scenario: string | undefined;

  constructor(deps: { logger: any }, options: { controlPort: MessagePort; scenario?: string }) {
    super(deps);
    this.controlPort = options.controlPort;
    this.scenario = options.scenario;
  }

  protected override createWorker(): Worker {
    this.createdWorker = new NodeWorker(stubWorkerPath, {
      workerData: { controlPort: this.controlPort, scenario: this.scenario },
      transferList: [this.controlPort],
    });

    return this.createdWorker;
  }
}

export interface HarnessOptions {
  /** Passed to the stub worker; 'crashOnBoot' makes it throw before it can speak the protocol. */
  scenario?: string;
}

export async function createHarness(options: HarnessOptions = {}) {
  const { port1: testPort, port2: workerPort } = new MessageChannel();
  const { logger, entries, messages } = createTestLogger();

  // Requests the stub has relayed but the test has not consumed yet.
  const pendingRequests = new Array<WorkerRequest>();
  const requestWaiters = new Array<(request: WorkerRequest) => void>();

  let booted = options.scenario === 'crashOnBoot';
  const bootWaiters = new Array<() => void>();

  testPort.on('message', (message: { type: string; request?: WorkerRequest }) => {
    if (message.type === 'booted') {
      booted = true;
      bootWaiters.splice(0).forEach(resolve => resolve());
      return;
    }

    if (message.type !== 'request' || !message.request)
      return;

    const waiter = requestWaiters.shift();

    if (waiter)
      waiter(message.request);
    else
      pendingRequests.push(message.request);
  });

  const foodIndex = new StubbedFoodIndex({ logger }, { controlPort: workerPort, scenario: options.scenario });
  await foodIndex.init();

  // Responses FoodIndex has finished dispatching. Registered after FoodIndex's own listener, and listeners
  // run in registration order, so anything recorded here has already been applied to the index state.
  const dispatched = new Array<WorkerResponse>();
  const dispatchWaiters = new Array<{ predicate: (msg: WorkerResponse) => boolean; resolve: () => void }>();

  foodIndex.createdWorker.on('message', (response: WorkerResponse) => {
    dispatched.push(response);

    for (let i = dispatchWaiters.length - 1; i >= 0; i--) {
      if (!dispatchWaiters[i].predicate(response))
        continue;

      dispatchWaiters[i].resolve();
      dispatchWaiters.splice(i, 1);
    }
  });

  // Worker lifecycle events, observed after FoodIndex's own handlers have run.
  const workerFailures = new Array<'error' | 'exit'>();
  const failureWaiters = new Array<() => void>();

  const recordFailure = (kind: 'error' | 'exit') => () => {
    workerFailures.push(kind);
    failureWaiters.splice(0).forEach(resolve => resolve());
  };

  foodIndex.createdWorker.on('error', recordFailure('error'));
  foodIndex.createdWorker.on('exit', recordFailure('exit'));

  /** Resolves once FoodIndex has handled a worker error or unexpected exit. */
  const awaitWorkerFailure = (): Promise<void> => {
    if (workerFailures.length)
      return Promise.resolve();

    return new Promise<void>((resolve) => {
      failureWaiters.push(resolve);
    });
  };

  // Message driven rather than polled, so it works while fake timers are installed.
  const awaitDispatched = (predicate: (msg: WorkerResponse) => boolean): Promise<void> => {
    if (dispatched.some(predicate))
      return Promise.resolve();

    return new Promise<void>((resolve) => {
      dispatchWaiters.push({ predicate, resolve });
    });
  };

  if (!booted)
    await new Promise<void>(resolve => bootWaiters.push(resolve));

  /** Waits for the next request FoodIndex posts to the worker. */
  const nextRequest = (): Promise<WorkerRequest> => {
    const buffered = pendingRequests.shift();

    if (buffered)
      return Promise.resolve(buffered);

    return new Promise<WorkerRequest>((resolve) => {
      requestWaiters.push(resolve);
    });
  };

  /** Makes the stub worker post a response back to FoodIndex. */
  const respond = (response: WorkerResponse): void => {
    testPort.postMessage({ type: 'respond', response });
  };

  const nextRequestOfType = async <T extends WorkerRequest['type']>(type: T) => {
    const request = await nextRequest();
    expect(request.type).toBe(type);

    return request as Extract<WorkerRequest, { type: T }>;
  };

  return {
    foodIndex: foodIndex as FoodIndex,
    get worker() {
      return foodIndex.createdWorker;
    },
    logger,
    logEntries: entries,
    logMessages: messages,
    nextRequest,
    nextRequestOfType,
    respond,
    awaitDispatched,
    awaitWorkerFailure,

    /** Drives the initial build to completion for the given locales. */
    async ready(locales: string[], results?: LocaleBuildResult[]) {
      respond({ type: 'initialising', locales });
      respond({
        type: 'ready',
        results: results ?? locales.map(localeId => ({ localeId, success: true as const })),
      });

      await awaitDispatched(msg => msg.type === 'ready');
    },

    /** Completes an in-flight rebuild successfully and waits for the result to be applied. */
    async completeRebuild(id: number, enabledLocales: string[], results?: LocaleBuildResult[]) {
      respond({
        type: 'rebuild',
        id,
        success: true,
        results: results ?? enabledLocales.map(localeId => ({ localeId, success: true as const })),
        enabledLocales,
      });

      await awaitDispatched(msg => msg.type === 'rebuild' && msg.id === id);
    },

    /** Fails an in-flight rebuild and waits for the failure to be applied. */
    async failRebuild(id: number, error: Error) {
      respond({ type: 'rebuild', id, success: false, error });

      await awaitDispatched(msg => msg.type === 'rebuild' && msg.id === id);
    },

    /**
     * Asserts that FoodIndex has no further work queued.
     *
     * close() always posts an exit request, and every request travels the same worker channel in order, so
     * if the next thing to arrive is the exit then nothing else was dispatched in between.
     */
    async assertNoFurtherRequests() {
      foodIndex.close();
      expect(await nextRequest()).toEqual({ type: 'exit' });
    },

    /** Makes the stub worker throw asynchronously, surfacing as an 'error' event on FoodIndex. */
    crashWorker(message = 'simulated worker crash') {
      testPort.postMessage({ type: 'crash', message });
    },

    /** Makes the stub worker exit, surfacing as an 'exit' event on FoodIndex. */
    exitWorker(code = 1) {
      testPort.postMessage({ type: 'exit', code });
    },

    async dispose() {
      testPort.close();
      await foodIndex.createdWorker?.terminate();
    },
  };
}

export function searchParams(localeId: string, description = 'apple'): SearchQueryParameters {
  return applyDefaultSearchQueryParameters(localeId, description, {});
}

export function searchResults(name: string): FoodSearchResponse {
  return { foods: [{ name }], categories: [] } as unknown as FoodSearchResponse;
}
