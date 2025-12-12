import path from 'node:path';
import { initServer } from '@ts-rest/express';
import fs from 'fs-extra';
import { pick } from 'lodash';
import { ForbiddenError, NotFoundError } from '@intake24/api/http/errors';
import { contract } from '@intake24/common/contracts';
import type { JobAttributes } from '@intake24/common/types/http/admin';
import type { WhereOptions } from '@intake24/db';
import { Job, Op } from '@intake24/db';

export function job() {
  return initServer().router(contract.admin.user.job, {
    browse: async ({ query, req }) => {
      const { userId } = req.scope.cradle.user;
      const { type, ...rest } = query;

      const whereOp: WhereOptions = {
        userId,
        params: Object.entries(pick(rest, ['localeId', 'nutrientTableId', 'surveyId']))
          .reduce<Record<string, string | number>>((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {}),
      };
      if (type)
        whereOp.type = type;

      const jobs = await Job.paginate<() => JobAttributes>({
        query: pick(req.query, ['page', 'limit', 'sort', 'search']),
        columns: ['type'],
        where: whereOp,
        order: [['startedAt', 'DESC']],
      });

      return { status: 200, body: jobs };
    },
    submit: async ({ body: { type, params }, req }) => {
      const { userId } = req.scope.cradle.user;

      const resource = params.resource.split('.')[0];
      if (!(await req.scope.cradle.aclService.hasPermission(`${resource}:browse`)))
        throw new ForbiddenError();

      const jobEntry = await req.scope.cradle.scheduler.jobs.addJob(
        { userId, type, params },
        { delay: 500 },
      );

      return { status: 200, body: jobEntry };
    },
    read: async ({ params: { jobId: id }, req }) => {
      const { userId } = req.scope.cradle.user;

      const job = await Job.findOne({ where: { id, userId } });
      if (!job)
        throw new NotFoundError();

      return { status: 200, body: job };
    },
    download: async ({ params: { jobId: id }, req, res }) => {
      const { userId } = req.scope.cradle.user;

      const job = await Job.findOne({
        attributes: ['id', 'downloadUrl'],
        where: {
          id,
          userId,
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
        body: fs.createReadStream(file),
      };
    },
  });
}
