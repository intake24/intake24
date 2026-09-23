import type { SearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { LocaleBuildResult, WorkerResponse } from '@intake24/api/food-index/worker-protocol';
import type { IoC } from '@intake24/api/ioc';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import { Worker } from 'node:worker_threads';

import config from '@intake24/api/config';
import { NotFoundError, ServiceTimeoutError, ServiceUnavailableError } from '@intake24/api/http/errors';
import { FoodsLocale } from '@intake24/db';

const SEARCH_TIMEOUT_MS = 10000;

type PendingRequest
  = | {
    type: 'search';
    resolve: (results: FoodSearchResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }
  | { type: 'rebuild' };

type WorkerState = 'running' | 'failed';
type LocaleIndexState = 'initialising' | 'ready' | 'failed';

export class FoodIndex {
  private workerState: WorkerState = 'failed';
  private initialisationComplete = false;
  private idCounter = 0;
  private indexWorker!: Worker;
  private readonly logger;
  private readonly localeStates = new Map<string, LocaleIndexState>();
  private readonly pendingRequests = new Map<number, PendingRequest>();
  private readonly dirtyLocales = new Set<string>();
  private rebuildAllRequested = false;
  private rebuildInProgress = false;
  private closeRequested = false;

  constructor({ logger }: Pick<IoC, 'logger'>) {
    this.logger = logger.child({ service: 'FoodIndex' });
  }

  private logPendingRequestMismatch(id: number, expectedType: PendingRequest['type'], pendingRequest: PendingRequest): void {
    this.logger.error(`Pending request type mismatch for ID ${id}: expected "${expectedType}", received "${pendingRequest.type}".`);
  }

  private hasWorkerFailed(): boolean {
    return this.workerState === 'failed';
  }

  private timeoutSearch(id: number): void {
    const pendingRequest = this.pendingRequests.get(id);

    // If response arrives first it should cancel the matching timeout, so a timeout should not see a deleted pending
    // request here.
    if (!pendingRequest) {
      this.logger.error(`Pending request ID ${id} not found while processing a timeout`);
      return;
    }

    if (pendingRequest.type !== 'search') {
      this.logPendingRequestMismatch(id, 'search', pendingRequest);
      return;
    }

    this.pendingRequests.delete(id);
    pendingRequest.reject(new ServiceTimeoutError(`Food index search timed out after ${SEARCH_TIMEOUT_MS}ms`));
  }

  private rejectPendingSearches(error: Error): void {
    for (const [id, pendingRequest] of this.pendingRequests) {
      if (pendingRequest.type !== 'search')
        continue;

      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(id);
      pendingRequest.reject(error);
    }
  }

  private failWorker(error: Error): void {
    if (this.workerState === 'failed')
      return;

    this.workerState = 'failed';
    this.logger.error(error);
    this.rejectPendingSearches(new Error('Food index worker failed'));
    this.pendingRequests.clear();
    this.dirtyLocales.clear();
    this.rebuildAllRequested = false;
    this.rebuildInProgress = false;
  }

  private applyInitialBuildResults(results: LocaleBuildResult[]): void {
    const completedLocales = new Set<string>();

    for (const result of results) {
      completedLocales.add(result.localeId);

      if (result.success) {
        this.localeStates.set(result.localeId, 'ready');
      }
      else {
        this.localeStates.set(result.localeId, 'failed');
        this.logger.error(result.error);
      }
    }

    for (const [localeId, state] of this.localeStates) {
      if (state !== 'initialising' || completedLocales.has(localeId))
        continue;

      this.localeStates.set(localeId, 'failed');
      this.logger.error(`Initial food index build did not return a result for locale "${localeId}".`);
    }
  }

  private applyRebuildResults(results: LocaleBuildResult[], enabledLocales: string[]): void {
    for (const result of results) {
      if (result.success) {
        this.localeStates.set(result.localeId, 'ready');
        continue;
      }

      this.logger.error(result.error);

      if (this.localeStates.get(result.localeId) !== 'ready')
        this.localeStates.set(result.localeId, 'failed');
    }

    // The worker re-reads the enabled locale list on every rebuild and drops the indexes of locales missing
    // from it, so any locale we still hold a state for is no longer searchable.
    const enabled = new Set(enabledLocales);

    for (const localeId of this.localeStates.keys()) {
      if (enabled.has(localeId))
        continue;

      this.localeStates.delete(localeId);
      this.logger.warn(`Food indexing is no longer enabled for locale "${localeId}", its index has been discarded.`);
    }
  }

  /**
   * Records locales that need to be rebuilt. Locales marked dirty while a rebuild is in progress are
   * picked up by the next rebuild, including locales that are being rebuilt right now: their source data
   * could have changed after the current rebuild started reading it.
   *
   * An undefined locale list means "rebuild every enabled locale".
   */
  private markLocalesDirty(locales: string[] | undefined): void {
    if (locales === undefined) {
      this.rebuildAllRequested = true;
      return;
    }

    for (const localeId of locales) {
      this.dirtyLocales.add(localeId);

      // Make searches for locales that have never been indexed fail with "not ready" rather than
      // "unknown locale" while the rebuild is pending.
      if (!this.localeStates.has(localeId))
        this.localeStates.set(localeId, 'initialising');
    }
  }

  private startRebuildIfDirty(): void {
    if (this.hasWorkerFailed() || !this.initialisationComplete || this.rebuildInProgress)
      return;

    if (!this.rebuildAllRequested && this.dirtyLocales.size === 0)
      return;

    // A pending "rebuild everything" request supersedes any individual locale requests.
    const locales = this.rebuildAllRequested ? undefined : [...this.dirtyLocales];

    this.dirtyLocales.clear();
    this.rebuildAllRequested = false;

    const id = this.idCounter++;

    this.rebuildInProgress = true;
    this.pendingRequests.set(id, { type: 'rebuild' });
    this.indexWorker.postMessage({
      type: 'rebuild',
      id,
      locales,
    });
  }

  private dispatchWorkerResponse(msg: WorkerResponse): void {
    switch (msg.type) {
      case 'initialising':
        for (const localeId of msg.locales)
          this.localeStates.set(localeId, 'initialising');
        return;

      case 'ready':
        this.applyInitialBuildResults(msg.results);
        this.initialisationComplete = true;
        this.startRebuildIfDirty();
        return;

      case 'search': {
        const pendingRequest = this.pendingRequests.get(msg.id);

        if (!pendingRequest) {
          this.logger.warn(`Ignoring late search response for request ID ${msg.id}.`);
          return;
        }

        if (pendingRequest.type !== 'search') {
          this.logPendingRequestMismatch(msg.id, 'search', pendingRequest);
          return;
        }

        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(msg.id);

        if (msg.success) {
          pendingRequest.resolve(msg.results);
        }
        else {
          // The worker index can be dropped between this request being posted and the worker handling it,
          // for example by a rebuild that found the locale is no longer enabled.
          pendingRequest.reject(
            msg.errorType === 'locale-not-indexed'
              ? new NotFoundError(msg.error.message)
              : msg.error,
          );
        }

        return;
      }

      case 'rebuild': {
        const pendingRequest = this.pendingRequests.get(msg.id);
        if (!pendingRequest) {
          this.logger.error(`No pending rebuild request found for ID ${msg.id}.`);
          return;
        }

        if (pendingRequest.type !== 'rebuild') {
          this.logPendingRequestMismatch(msg.id, 'rebuild', pendingRequest);
          return;
        }

        this.pendingRequests.delete(msg.id);
        this.rebuildInProgress = false;

        if (msg.success) {
          this.applyRebuildResults(msg.results, msg.enabledLocales);
        }
        else {
          // Locale states are left untouched: the rebuild failed before it could establish which locales
          // are enabled, so the existing indexes are still whatever the last successful build produced.
          this.logger.error(msg.error);
        }

        this.startRebuildIfDirty();
        return;
      }

      default:
        this.logger.error(`Unexpected message from worker: ${JSON.stringify(msg)}`);
    }
  }

  /**
   * Creates the index builder worker thread. Overridable so that tests can substitute a stub worker that
   * speaks the same protocol without touching the database.
   */
  protected createWorker(): Worker {
    return new Worker('./dist/foodIndex.mjs', {
      workerData: {
        env: config.app.env,
        dbConnectionInfo: config.database,
      },
    });
  }

  async init(): Promise<void> {
    this.initialisationComplete = false;
    this.localeStates.clear();
    this.dirtyLocales.clear();
    this.rebuildAllRequested = false;
    this.rebuildInProgress = false;
    this.closeRequested = false;

    this.indexWorker = this.createWorker();
    this.workerState = 'running';

    this.indexWorker.on('message', msg => this.dispatchWorkerResponse(msg));
    this.indexWorker.on('error', (error) => {
      this.failWorker(error);
    });
    this.indexWorker.on('exit', (code) => {
      if (!this.closeRequested)
        this.failWorker(new Error(`Food index worker exited unexpectedly with code ${code}`));
    });
  }

  close() {
    this.closeRequested = true;
    this.indexWorker.postMessage({ type: 'exit' });
  }

  async queueRebuild(localeId?: string[]) {
    if (this.hasWorkerFailed()) {
      this.logger.error('Cannot rebuild food indexes because the worker has failed.');
      return;
    }

    let locales: string[] | undefined;

    if (localeId) {
      locales = (await FoodsLocale.findAll({ attributes: ['id'], where: { id: localeId } }))
        .map(locale => locale.id);

      if (locales.length === 0) {
        this.logger.warn(`Ignoring food index rebuild request: none of the requested locales exist (${JSON.stringify(localeId)}).`);
        return;
      }
    }

    // The worker can fail while the locale lookup is in progress.
    if (this.hasWorkerFailed()) {
      this.logger.error('Cannot rebuild food indexes because the worker has failed.');
      return;
    }

    this.markLocalesDirty(locales);

    // Does nothing if the initial build or another rebuild is still in progress: the dirty locales will
    // be picked up when that build completes.
    this.startRebuildIfDirty();
  }

  async search(parameters: SearchQueryParameters): Promise<FoodSearchResponse> {
    if (this.workerState === 'failed')
      throw new Error('Food index worker has failed');

    if (!this.initialisationComplete)
      throw new ServiceUnavailableError('Food index is not ready');

    switch (this.localeStates.get(parameters.localeId)) {
      case 'initialising':
        throw new ServiceUnavailableError(`Food index for locale "${parameters.localeId}" is not ready`);

      case 'failed':
        throw new Error(`Food index for locale "${parameters.localeId}" is in a failed state`);

      case 'ready':
        return new Promise((resolve, reject) => {
          const id = this.idCounter++;
          const timeout = setTimeout(() => this.timeoutSearch(id), SEARCH_TIMEOUT_MS);
          timeout.unref(); // This lets Node quit the process if this timeout is still running

          this.pendingRequests.set(id, {
            type: 'search',
            resolve,
            reject,
            timeout,
          });

          this.indexWorker.postMessage({
            type: 'search',
            id,
            parameters,
          });
        });

      default:
        // The locale does not exist, or food indexing is not enabled for it, so it has no index to search.
        throw new NotFoundError(`No food index found for locale "${parameters.localeId}"`);
    }
  }
}

export default FoodIndex;
