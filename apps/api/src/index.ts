/* eslint-disable perfectionist/sort-imports */
import '@intake24/api/bootstrap';

import type { Express } from 'express';

import type { Server } from 'node:https';
import { createServer } from 'node:https';
import { homedir } from 'node:os';

import { join } from 'node:path';
import { readFile } from 'fs-extra';
import type { Ops } from '@intake24/api/app';

import app from '@intake24/api/app';
import ioc from '@intake24/api/ioc';
import { getMemoryUsage } from './util';

const appOps = { config: ioc.cradle.config, logger: ioc.cradle.logger };

async function startApp(ops: Ops): Promise<void> {
  const { config, logger } = ops;
  const { name, host, port, https, certPath } = config.app;

  let server: Express | Server = await app(ops);

  if (https) {
    const home = homedir();
    const [cert, key, ca] = await Promise.all(
      ['cert.pem', 'dev.pem', 'rootCA.pem'].map((file) => {
        const path = certPath ? join(certPath, file) : join(home, '.vite-plugin-mkcert', file);
        return readFile(path);
      }),
    );

    server = createServer({ key, cert, ca }, server);
  }

  // Start listening
  server.listen(port, host, () => {
    logger.child({ service: 'Application' }).info(`${name} is listening on ${host}:${port}!`);
  });

  setInterval(() => {
    const memory = getMemoryUsage();
    console.log(`Memory: RSS ${memory.rss} MB, Heap Used ${memory.heapUsed} MB, Heap Total ${memory.heapTotal} MB, External ${memory.external} MB, Array Buffers ${memory.arrayBuffers} MB`);
    /* logger
      .child({ service: 'MemoryUsage' })
      .info(
        `Memory Usage: RSS ${memory.rss} MB, Heap Used ${memory.heapUsed} MB, Heap Total ${memory.heapTotal} MB`,
      ); */
  }, 5000);
}

(async () => {
  await startApp(appOps);
})();
