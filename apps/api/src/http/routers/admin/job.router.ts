import { createReadStream } from 'node:fs';

import path from 'node:path';
import { initServer } from '@ts-rest/express';
import fs from 'fs-extra';

import { NotFoundError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import type { JobAttributes } from '@intake24/common/types/http/admin';
import { Job, Op } from '@intake24/db';

export function job() {
  return initServer().router(contract.admin.job, {
    browse: {
      middleware: [permission('jobs', 'jobs:browse')],
      handler: async ({ query }) => {
        const jobs = await Job.paginate<() => JobAttributes>({
          query,
          columns: ['type'],
          order: [['startedAt', 'DESC']],
          attributes: ['id', 'type', 'userId', 'startedAt', 'completedAt', 'successful', 'downloadUrl', 'downloadUrlExpiresAt'],
          include: [{ association: 'user', attributes: ['name', 'email'], required: false }],
        });

        return { status: 200, body: jobs };
      },
    },
    read: {
      middleware: [permission('jobs', 'jobs:read')],
      handler: async ({ params: { jobId } }) => {
        const job = await Job.findByPk(jobId, {
          include: [{ association: 'user', attributes: ['name', 'email'], required: false }],
        });
        if (!job)
          throw new NotFoundError();

        return { status: 200, body: job };
      },
    },
    destroy: {
      middleware: [permission('jobs', 'jobs:delete')],
      handler: async ({ params: { jobId } }) => {
        const job = await Job.findByPk(jobId, { attributes: ['id'] });
        if (!job)
          throw new NotFoundError();

        await job.destroy();

        return { status: 204, body: undefined };
      },
    },
    download: {
      middleware: [permission('jobs', 'jobs:read')],
      handler: async ({ params: { jobId: id }, req, res }) => {
        const job = await Job.findOne({
          attributes: ['id', 'downloadUrl'],
          where: {
            id,
            downloadUrl: { [Op.ne]: null },
            downloadUrlExpiresAt: { [Op.gt]: new Date() },
          },
        });

        if (!job?.downloadUrl)
          throw new NotFoundError();
        const { downloadUrl } = job;

        const file = path.resolve(req.scope.cradle.fsConfig.local.downloads, downloadUrl);
        if (!(await fs.pathExists(file)))
          throw new NotFoundError();

        const { size } = await fs.stat(file);

        res.set('Content-Disposition', `attachment; filename=${downloadUrl}`);
        res.set('Content-Length', size.toString());

        return {
          status: 200,
          contentType: 'application/octet-stream',
          body: createReadStream(file),
        };
      },
    },
    repeat: {
      middleware: [permission('jobs', 'jobs:edit')],
      handler: async ({ params: { jobId }, body, req }) => {
        const job = await Job.findByPk(jobId, { attributes: ['id', 'type', 'userId', 'params'] });
        if (!job || (body?.type && body.type !== job.type))
          throw new NotFoundError();

        const { type, userId, params } = job;

        const jobEntry = await req.scope.cradle.scheduler.jobs.addJob({ type, userId, params: body?.params ?? params });

        return { status: 200, body: jobEntry };
      },
    },
  });
}
