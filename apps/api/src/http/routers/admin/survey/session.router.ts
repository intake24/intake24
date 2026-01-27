import type { WhereOptions } from 'sequelize';

import type { UserSurveySessionAttributes } from '@intake24/db';

import { initServer } from '@ts-rest/express';
import { cast, col, Op, where } from 'sequelize';

import { NotFoundError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';
import { Survey, UserSurveySession } from '@intake24/db';

export function session() {
  return initServer().router(contract.admin.survey.session, {
    browse: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId }, query, req }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'sessions', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        const { search } = query;
        const isPostgres = UserSurveySession.sequelize?.getDialect() === 'postgres';
        const op = isPostgres ? Op.iLike : Op.substring;
        const value = isPostgres ? `%${search}%` : search;
        const whereClause: WhereOptions<UserSurveySessionAttributes> = typeof search === 'string' && search
          ? {
              [Op.and]: {
                surveyId,
                [Op.or]: [
                  where(cast(col('UserSurveySession.id'), 'text'), op, value),
                  { '$alias.username$': { [op]: value } },
                ],
              },
            }
          : { surveyId };

        const sessions = await UserSurveySession.paginate({
          query,
          where: whereClause,
          include: [{ association: 'alias', attributes: ['username'], where: { surveyId } }],
          order: [['createdAt', 'ASC']],
          subQuery: false,
          transform: (session) => {
            const { alias, ...rest } = session.get();

            return { ...rest, username: alias!.username };
          },
        });

        return { status: 200, body: sessions };
      },
    },
    read: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId, sessionId }, req }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'sessions', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        const session = await UserSurveySession.findOne({ where: { id: sessionId, surveyId } });
        if (!session)
          throw new NotFoundError();

        return { status: 200, body: session };
      },
    },
    destroy: {
      middleware: [permission('surveys')],
      handler: async ({ params: { surveyId, sessionId }, req }) => {
        await req.scope.cradle.aclService.findAndCheckRecordAccess(Survey, 'sessions', {
          attributes: ['id'],
          where: { id: surveyId },
        });

        const session = await UserSurveySession.findOne({ where: { id: sessionId, surveyId } });
        if (!session)
          throw new NotFoundError();

        await session.destroy();

        return { status: 204, body: undefined };
      },
    },
  });
}
