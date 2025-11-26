import type { Express } from 'express';
import { createMiddleware } from '@promster/express';
import cron, { ScheduledTask } from 'node-cron';
import prom, { collectDefaultMetrics, register as defaultRegister } from 'prom-client';
import { IoC } from '@intake24/api/ioc';
import { Dictionary } from '@intake24/common/types';
import { DatabasesInterface, KyselyDatabases } from '@intake24/db';
import { MetricsConfig } from '../config/metrics';

const kyselySystemLabels = { db: 'system', interface: 'kysely' } as const;
const kyselyFoodsLabels = { db: 'foods', interface: 'kysely' } as const;

const sequelizeSystemLabels = { db: 'system', interface: 'sequelize' } as const;
const sequelizeFoodsLabels = { db: 'foods', interface: 'sequelize' } as const;

export function getHttpStatusLabel(
  statusCode: number,
): number {
  if (statusCode >= 200 && statusCode < 300) {
    return 200;
  }

  // redirects
  if (statusCode >= 100 && statusCode < 400) {
    return 200;
  }

  if (statusCode >= 400 && statusCode < 500) {
    return 400;
  }

  return 500;
}

type HttpMethodLabel = 'GET' | 'POST';

export function getHttpMethodLabel(method: string): HttpMethodLabel {
  if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    return 'GET';
  }

  return 'POST';
}

export function normalizeRequestPath(path: string): string {
  if (path.startsWith('/api/admin'))
    return '/admin/**';
  if (path.startsWith('/api/user'))
    return '/user/**';
  if (path.match(/^\/api\/surveys\/[^/]+\/submissions\/?(?:\?.*)?$/))
    return '/surveys/*/submission';
  if (path.match(/^\/api\/surveys\/[^/]+\/session$/))
    return '/surveys/*/session';
  if (path.match(/^\/api\/surveys\/[^/]+\/search\/?(?:\?.*)?$/))
    return '/surveys/*/search';

  return 'other';
}

export class AppMetricsService {
  private connectionPoolTotal?: prom.Gauge;
  private connectionPoolIdle?: prom.Gauge;
  private connectionPoolActive?: prom.Gauge;
  private connectionPoolPending?: prom.Gauge;
  private connectionDuration?: prom.Histogram;

  private readonly sequelizeDb: DatabasesInterface;
  private readonly kyselyDb: KyselyDatabases;
  private readonly metricsConfig: MetricsConfig;
  private readonly defaultLabels: Dictionary<string>;

  private cronTask?: ScheduledTask;

  constructor({ db, kyselyDb, metricsConfig }: Pick<IoC, 'db' | 'kyselyDb' | 'metricsConfig'>) {
    this.sequelizeDb = db;
    this.kyselyDb = kyselyDb;
    this.metricsConfig = metricsConfig;

    this.defaultLabels = {
      instance_id: metricsConfig.app.instanceId.intake24,
    };

    if (metricsConfig.app.instanceId.pm2 !== undefined)
      this.defaultLabels.pm2_instance_id = metricsConfig.app.instanceId.pm2;

    defaultRegister.setDefaultLabels(this.defaultLabels);

    // HTTP metrics implementation currently forces collectDefaultMetrics
    if (this.metricsConfig.app.collectDefaultMetrics && !this.metricsConfig.app.http.enabled) {
      collectDefaultMetrics();
    }
  }

  initDatabaseMetrics() {
    const databaseLabelNames = ['db', 'interface', 'instance_id', 'pm2_instance_id'];

    if (this.metricsConfig.app.db.collectConnectionPoolStats) {
      this.connectionPoolTotal = new prom.Gauge({
        name: 'it24_db_total_connections',
        help: 'Total connections in the database connection pool',
        labelNames: databaseLabelNames,
      });

      this.connectionPoolIdle = new prom.Gauge({
        name: 'it24_db_idle_connections',
        help: 'Idle connections in the database connection pool',
        labelNames: databaseLabelNames,
      });

      this.connectionPoolActive = new prom.Gauge({
        name: 'it24_db_active_connections',
        help: 'Active connections in the database connection pool',
        labelNames: databaseLabelNames,
      });

      this.connectionPoolPending = new prom.Gauge({
        name: 'it24_db_pending_connections',
        help: 'Pending requests waiting for a connection in the database connection pool',
        labelNames: databaseLabelNames,
      });

      this.cronTask = cron.schedule('*/5 * * * * *', () => {
        this.collectSequelizeConnectionPoolStats();
        this.collectKyselyConnectionPoolStats();
      });
    }

    if (this.metricsConfig.app.db.collectConnectionDuration) {
      this.connectionDuration = new prom.Histogram({
        name: 'it24_db_connection_duration_ms',
        help: 'Duration a database connection is used by clients',
        labelNames: databaseLabelNames,
        buckets: prom.exponentialBuckets(50, 2, 10),
      });

      this.watchKyselyConnectionDuration(kyselySystemLabels, this.kyselyDb.systemConnectionPool);
      this.watchKyselyConnectionDuration(kyselyFoodsLabels, this.kyselyDb.foodsConnectionPool);

      this.watchSequelizeConnectionDuration(sequelizeSystemLabels, (this.sequelizeDb.system!.connectionManager as any).pool);
      this.watchSequelizeConnectionDuration(sequelizeFoodsLabels, (this.sequelizeDb.foods!.connectionManager as any).pool);
    }
  }

  async useHttpMetricsMiddleware(app: Express) {
    if (this.metricsConfig.app.http.enabled) {
      const metricTypes = ['httpRequestsTotal'];

      if (this.metricsConfig.app.http.collectRequestDuration)
        metricTypes.push('httpRequestsHistogram');

      if (this.metricsConfig.app.http.collectContentLength)
        metricTypes.push('httpContentLengthHistogram');

      const metricsMiddleware = createMiddleware(
        {
          app,
          options: {
            metricTypes,
            normalizeMethod: (method, _) => getHttpMethodLabel(method),
            normalizeStatusCode: (code, _) => getHttpStatusLabel(code),
            normalizePath: path => normalizeRequestPath(path),
            metricBuckets: {
              httpRequestContentLengthInBytes: [
                1000,
                5000,
                10000,
                50000,
                1000000,
                10000000,
              ],
              httpRequestDurationInSeconds: [
                0.05,
                0.1,
                0.2,
                0.3,
                0.5,
                1,
                2,
                5,
                10,
              ],
            },
          },
        },
      );

      app.use(metricsMiddleware);
    }
  }

  shutdown() {
    this.cronTask?.destroy();
    this.cronTask = undefined;
  }

  watchSequelizeConnectionDuration(labels: Dictionary<string>, pool: any) {
    const originalAcquire = pool.acquire;
    const originalRelease = pool.release;
    const connectionDurationHistogram = this.connectionDuration;

    pool.acquire = function (this: any, ...args: any[]) {
      return originalAcquire.apply(this, args).then((conn: any) => {
        conn.__acquiredAt = Date.now();
        return conn;
      });
    };

    pool.release = function (this: any, conn: any, ...args: any[]) {
      if (conn && conn.__acquiredAt) {
        connectionDurationHistogram!.observe(
          labels,
          Date.now() - conn.__acquiredAt,
        );
        delete (conn as any).__acquiredAt;
      }
      return originalRelease.apply(this, [conn, ...args]);
    };
  }

  private watchKyselyConnectionDuration(labels: Dictionary<string>, pool: any) {
    pool.on('acquire', (conn: any) => conn.__acquiredAt = Date.now());
    pool.on('release', (conn: any) => {
      if (conn && conn.__acquiredAt) {
        this.connectionDuration!.observe(labels, Date.now() - conn.__acquiredAt);
        delete conn.__acquiredAt;
      }
    });
  }

  private collectSequelizeConnectionPoolStats() {
    // These are not public in Sequelize v6 but will be in v7, remove this hack when/if upgraded to v7
    const systemPool = (this.sequelizeDb.system!.connectionManager as any).pool;
    const foodsPool = (this.sequelizeDb.foods!.connectionManager as any).pool;

    this.connectionPoolTotal!.set(sequelizeSystemLabels, systemPool.size);
    this.connectionPoolTotal!.set(sequelizeFoodsLabels, foodsPool.size);

    this.connectionPoolActive!.set(sequelizeSystemLabels, systemPool.using);
    this.connectionPoolActive!.set(sequelizeFoodsLabels, foodsPool.using);

    this.connectionPoolIdle!.set(sequelizeSystemLabels, systemPool.available);
    this.connectionPoolIdle!.set(sequelizeFoodsLabels, foodsPool.available);

    this.connectionPoolPending!.set(sequelizeSystemLabels, systemPool.waiting);
    this.connectionPoolPending!.set(sequelizeFoodsLabels, foodsPool.waiting);
  }

  private collectKyselyConnectionPoolStats() {
    const systemPool = this.kyselyDb.systemConnectionPool;
    const foodsPool = this.kyselyDb.foodsConnectionPool;

    this.connectionPoolTotal!.set(kyselySystemLabels, systemPool.totalCount);
    this.connectionPoolTotal!.set(kyselyFoodsLabels, foodsPool.totalCount);

    this.connectionPoolActive!.set(kyselySystemLabels, systemPool.totalCount - systemPool.idleCount);
    this.connectionPoolActive!.set(kyselyFoodsLabels, foodsPool.totalCount - foodsPool.idleCount);

    this.connectionPoolIdle!.set(kyselySystemLabels, systemPool.idleCount);
    this.connectionPoolIdle!.set(kyselyFoodsLabels, foodsPool.idleCount);

    this.connectionPoolPending!.set(kyselySystemLabels, systemPool.waitingCount);
    this.connectionPoolPending!.set(kyselyFoodsLabels, foodsPool.waitingCount);
  }

  async getMetrics(): Promise<string> {
    return defaultRegister.metrics();
  }
}
