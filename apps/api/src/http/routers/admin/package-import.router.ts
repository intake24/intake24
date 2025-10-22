import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initServer } from '@ts-rest/express';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import ValidationError from '../../errors/validation.error';
import { PackageImportState } from './io/package-import-state';

export function packageImport() {
  const uploadDirPath = path.join(os.tmpdir(), 'i24-pkg-upload');

  if (!fs.existsSync(uploadDirPath)) {
    fs.mkdirSync(uploadDirPath, { recursive: true });
  }

  return initServer().router(contract.admin.packageImport, {
    upload: {
      middleware: [permission('import-package')],
      handler: async ({ req }) => {
        const file = req.file;

        if (!file) {
          throw ValidationError.from({ path: 'params.file', i18n: { type: 'file._' } });
        }

        const cache = req.scope.cradle.cache;
        const jobScheduler = req.scope.cradle.scheduler.jobs;

        // Because job parameters are exposed in the database record and are visible to the owning user,
        // passing full path in the local file system as a job parameter is unsafe, so put it in Redis
        // and use an opaque UUID instead.

        const importId = randomUUID();

        const importState: PackageImportState = {
          uploadPath: file.path,
          verified: false,
        };

        cache.set(`package-import:${importId}`, JSON.stringify(importState), '1h');

        const { userId } = req.scope.cradle.user;

        await jobScheduler.addJob(
          { userId, type: 'PackageVerification', params: { importId } },
        );

        return { status: 202, body: { importId } };
      },
    },
  });
}
