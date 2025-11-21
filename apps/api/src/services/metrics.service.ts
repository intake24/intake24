import cron from 'node-cron';
import prom, { collectDefaultMetrics } from 'prom-client';
import { IoC } from '@intake24/api/ioc';
import { Dictionary } from '@intake24/common/types';
import { DatabasesInterface, KyselyDatabases } from '@intake24/db';

const kyselySystemLabels = { db: 'system', interface: 'kysely' } as const;
const kyselyFoodsLabels = { db: 'foods', interface: 'kysely' } as const;

const sequelizeSystemLabels = { db: 'system', interface: 'sequelize' } as const;
const sequelizeFoodsLabels = { db: 'foods', interface: 'sequelize' } as const;

export class AppMetricsService {
  readonly registry: prom.Registry;

  // readonly httpRequestsTotal: prom.Counter;
  // readonly httpRequestDurationSeconds: prom.Histogram;

  private readonly connectionPoolTotal?: prom.Gauge;
  private readonly connectionPoolIdle?: prom.Gauge;
  private readonly connectionPoolActive?: prom.Gauge;
  private readonly connectionPoolPending?: prom.Gauge;
  private readonly connectionDuration?: prom.Histogram;

  private readonly sequelizeDb: DatabasesInterface;
  private readonly kyselyDb: KyselyDatabases;

  constructor({ db, kyselyDb, metricsConfig }: Pick<IoC, 'db' | 'kyselyDb' | 'metricsConfig'>) {
    this.sequelizeDb = db;
    this.kyselyDb = kyselyDb;

    this.registry = new prom.Registry();

    const defaultLabels: Dictionary<string> = {
      instance_id: metricsConfig.app.instanceId.intake24,
    };

    if (metricsConfig.app.instanceId.pm2 !== undefined)
      defaultLabels.pm2_instance_id = metricsConfig.app.instanceId.pm2;

    this.registry.setDefaultLabels(defaultLabels);

    // this.httpRequestsTotal = new prom.Counter({
    //   name: 'it24_http_requests_total',
    //   help: 'Total number of HTTP requests',
    //   labelNames: ['method', 'route', 'status_code'],
    //   registers: [this.registry],
    // });

    // this.httpRequestDurationSeconds = new prom.Histogram({
    //   name: 'it24_http_request_duration_seconds',
    //   help: 'Duration of HTTP requests in seconds',
    //   labelNames: ['method', 'route', 'status_code'],
    //   buckets: prom.exponentialBuckets(0.01, 2, 30),
    //   registers: [this.registry],
    // });

    if (metricsConfig.app.collectDefaultMetrics) {
      collectDefaultMetrics({ register: this.registry, labels: defaultLabels });
    }

    const databaseLabelNames = ['db', 'interface', 'instance_id', 'pm2_instance_id'];

    if (metricsConfig.app.db.collectConnectionPoolStats) {
      this.connectionPoolTotal = new prom.Gauge({
        name: 'it24_db_total_connections',
        help: 'Total connections in the database connection pool',
        labelNames: databaseLabelNames,
        registers: [this.registry],
      });

      this.connectionPoolIdle = new prom.Gauge({
        name: 'it24_db_idle_connections',
        help: 'Idle connections in the database connection pool',
        labelNames: databaseLabelNames,
        registers: [this.registry],
      });

      this.connectionPoolActive = new prom.Gauge({
        name: 'it24_db_active_connections',
        help: 'Active connections in the database connection pool',
        labelNames: databaseLabelNames,
        registers: [this.registry],
      });

      this.connectionPoolPending = new prom.Gauge({
        name: 'it24_db_pending_connections',
        help: 'Pending requests waiting for a connection in the database connection pool',
        labelNames: databaseLabelNames,
        registers: [this.registry],
      });

      cron.schedule('*/5 * * * * *', () => {
        this.collectSequelizeConnectionPoolStats();
        this.collectKyselyConnectionPoolStats();
      });
    }

    if (metricsConfig.app.db.collectConnectionDuration) {
      this.connectionDuration = new prom.Histogram({
        name: 'it24_db_connection_duration',
        help: 'Duration a database connection is used by clients',
        labelNames: databaseLabelNames,
        buckets: prom.exponentialBuckets(50, 2, 10),
        registers: [this.registry],
      });

      this.watchKyselyConnectionDuration(kyselySystemLabels, this.kyselyDb.systemConnectionPool);
      this.watchKyselyConnectionDuration(kyselyFoodsLabels, this.kyselyDb.foodsConnectionPool);

      this.watchSequelizeConnectionDuration(sequelizeSystemLabels, (this.sequelizeDb.system!.connectionManager as any).pool);
      this.watchSequelizeConnectionDuration(sequelizeFoodsLabels, (this.sequelizeDb.foods!.connectionManager as any).pool);
    }
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
    return this.registry.metrics();
  }
}
