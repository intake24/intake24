import type { Express } from 'express';
import type { Server } from 'node:http';

import type { MockData, MockFiles } from '.';
import type { SharedTests } from './shared-tests';
import type { Util } from './util';
import type { KyselyDatabases } from '@intake24/db';

import fs from 'fs-extra';

import app from '@intake24/api/app';
import foodIndex from '@intake24/api/food-index';
import ioc from '@intake24/api/ioc';

import { initDatabase, initFiles, wipeRedis } from '.';
import sharedTests from './shared-tests';
import util from './util';

export type Bearers = Record<'superuser' | 'user' | 'respondent', string>;

const {
  config,
  logger,
  db,
  kyselyDb,
  cache,
  rateLimiter,
  scheduler,
  session,
} = ioc.cradle;

class IntegrationSuite {
  public config;

  public logger;

  public db;

  public kyselyDb: KyselyDatabases;

  public cache;

  public rateLimiter;

  public scheduler;

  public session;

  public app!: Express | Server;

  public data!: MockData;

  public files!: MockFiles;

  public bearer!: Bearers;

  public sharedTests!: SharedTests;

  public util!: Util;

  constructor() {
    this.config = config;
    this.logger = logger;
    this.db = db;
    this.kyselyDb = kyselyDb;
    this.cache = cache;
    this.rateLimiter = rateLimiter;
    this.scheduler = scheduler;
    this.session = session;
  }

  /**
   * Initialize integration suite
   *
   * @memberof IntegrationSuite
   */
  public async init() {
    // Wipe Redis store data
    await wipeRedis();

    // Boot up application with all dependencies
    this.app = await app({ config: this.config, logger: this.logger });

    /*
    Workaround for issues with IPv6/IPv4 "dual-stacking":

    The testing library (supertest) will start the application on a randomly allocated ("ephemeral")
    port on localhost, and Node will bind to the IPv6 localhost ("::") by default if it is
    available.

    Supertest then uses a hard-coded hostname in IPv4 format ("127.0.0.1"). Normally operating
    systems support a feature called "dual-stacking" whereby the IPv4 localhost address is
    automatically translated to the IPv6 host, and apps trying to connect using IPv4 should be
    able to connect to the IPv6 socket.

    If this feature is unavailable or not able to be used for some reason, the test suite will
    fail to connect to the local app instance and will fail with a timeout.

    If the INTAKE24_TEST_SET_HOST environment variable is defined, the test suite will start the
    application using the port and hostname configured in the environment file instead of relying
    on supertest defaults. It is possible to pass a server reference instead of the app reference
    to supertest functions to achieve this.

    By setting the hostname to the IPv4 localhost ("127.0.0.1") in the environment file the
    application will bind to an IPv4 socket thus avoiding the potential IPv6/IPv4 mismatch.
    */

    if (process.env.INTAKE24_TEST_SET_HOST) {
      let listenResolve: (() => void) | undefined;
      const listenPromise = new Promise<void>((resolve) => {
        listenResolve = resolve;
      });

      this.app = this.app.listen(this.config.app.port, this.config.app.host, listenResolve);

      await listenPromise;
    }

    // Fill in database with initial data
    this.data = await initDatabase();

    // Grab mock files
    this.files = await initFiles();

    // Shared tests
    this.sharedTests = sharedTests(this);

    // Utilities
    this.util = util(this);
  }

  /**
   * Close all I/O connections
   * - databases
   * - redis clients (cache / queue / rate limiter / session)
   * - worker threads (food index)
   *
   * @memberof IntegrationSuite
   */
  public async close() {
    // Close redis store connections
    await Promise.all([
      this.cache.close(),
      this.rateLimiter.close(),
      this.session.close(),
    ]);

    // Close redis queue connections
    await this.scheduler.close();

    // Close database connections
    await Promise.all([
      this.db.close(),
      this.kyselyDb.close(),
    ]);

    // Close worker threads
    foodIndex.close();

    const { downloads, uploads, images } = this.config.filesystem.local;
    await Promise.all(
      [downloads, uploads, images].map(folder => fs.rm(folder, { recursive: true, force: true })),
    );
  }
}

export default new IntegrationSuite();
