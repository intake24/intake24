import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initServer } from '@ts-rest/express';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';

export function packageExport() {
  const uploadDirPath = path.join(os.tmpdir(), 'i24-pkg-upload');

  if (!fs.existsSync(uploadDirPath)) {
    fs.mkdirSync(uploadDirPath, { recursive: true });
  }

  return initServer().router(contract.admin.packageExport, {
    start: {
      middleware: [permission('export-package')],
      handler: async ({ req }) => {
        const jobScheduler = req.scope.cradle.scheduler.jobs;

        const { userId } = req.scope.cradle.user;

        const job = await jobScheduler.addJob(
          { userId, type: 'PackageExport', params: req.body },
        );

        return { status: 202, body: { jobId: job.id } };
      },
    },
  });
}
