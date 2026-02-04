import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';

export function packages() {
  return initServer().router(contract.admin.packages, {
    queueExport: {
      middleware: [permission('packages:export')],
      handler: async ({ req }) => {
        const jobScheduler = req.scope.cradle.scheduler.jobs;

        const { userId } = req.scope.cradle.user;

        const job = await jobScheduler.addJob(
          { userId, type: 'PackageExport', params: req.body },
        );

        return { status: 202, body: { jobId: job.id } };
      },
    },
    queueVerification: {
      middleware: [permission('packages:import')],
      handler: async ({ req }) => {
        const jobScheduler = req.scope.cradle.scheduler.jobs;

        const { userId } = req.scope.cradle.user;

        const job = await jobScheduler.addJob(
          { userId, type: 'PackageVerification', params: req.body },
        );

        return { status: 202, body: { jobId: job.id } };
      },
    },
    queueImport: {
      middleware: [permission('packages:import')],
      handler: async ({ req }) => {
        const jobScheduler = req.scope.cradle.scheduler.jobs;

        const { userId } = req.scope.cradle.user;

        const job = await jobScheduler.addJob(
          { userId, type: 'PackageImport', params: req.body },
        );

        return { status: 202, body: { jobId: job.id } };
      },
    },
  });
}
