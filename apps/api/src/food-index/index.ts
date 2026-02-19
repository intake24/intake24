import type { SearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import { Worker } from 'node:worker_threads';

import config from '@intake24/api/config';
import { logger } from '@intake24/common-backend/services';
import { FoodsLocale } from '@intake24/db';

let indexReady = false;
let queryIdCounter = 0;
let buildCounter = 0;
let indexWorker: Worker;

export class IndexNotReadyError extends Error {}

interface SearchResponse {
  queryId: number;
  success: boolean;
  results: FoodSearchResponse;
  error: Error;
}

interface RebuildResponse {
  buildCommandId: number;
  success: boolean;
  error: Error;
}

const foodIndex = {
  async init(): Promise<void> {
    indexWorker = new Worker('./dist/foodIndex.mjs', {
      workerData: {
        env: config.app.env,
        dbConnectionInfo: config.database,
      },
    });

    const readyListener = (msg: any) => {
      if (msg === 'ready') {
        indexReady = true;
        indexWorker.removeListener('message', readyListener);
      }
    };

    indexWorker.on('message', readyListener);
    indexWorker.on('error', (err) => {
      console.error(err);
    });
  },

  close() {
    indexWorker.postMessage({ type: 'command', exit: true });
  },

  async rebuild(localeId?: string[]) {
    const locales = localeId
      ? (await FoodsLocale.findAll({ attributes: ['id'], where: { id: localeId } }))
          .map(locale => locale.id)
      : undefined;

    if (indexReady) {
      buildCounter++;
      const buildId = buildCounter;

      const rebuildListener = (msg: RebuildResponse) => {
        if (msg.buildCommandId === buildId) {
          indexWorker.removeListener('message', rebuildListener);

          if (msg.success) {
            indexReady = true;
          }
          else {
            // TODO: should we throw an error here?
            indexReady = false;
            logger.error(msg.error);
          }
        }
      };

      indexWorker.on('message', rebuildListener);
      indexWorker.postMessage({
        type: 'command',
        buildId,
        rebuild: true,
        locales,
      });
    }
  },

  async search(parameters: SearchQueryParameters): Promise<FoodSearchResponse> {
    if (indexReady) {
      queryIdCounter += 1;

      return new Promise((resolve, reject) => {
        const queryId = queryIdCounter;

        const listener = (msg: SearchResponse) => {
          if (msg.queryId === queryId) {
            indexWorker.removeListener('message', listener);

            if (msg.success)
              resolve(msg.results);
            else
              reject(msg.error);
          }
        };

        indexWorker.on('message', listener);

        indexWorker.postMessage({
          type: 'query',
          queryId,
          parameters,
        });
      });
    }

    return Promise.reject(new IndexNotReadyError());
  },
};

export default foodIndex;

export type FoodIndex = typeof foodIndex;
