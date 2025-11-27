import type { FindOptions, WhereOptions } from 'sequelize';

import type { SurveySubmissionAttributes } from '../models/system';

export type SubmissionScope = {
  sessionId?: string | string[];
  surveyId?: string | string[];
  userId?: string | string[];
};

export function submissionScope(scopeOps: SubmissionScope = {}, ops: FindOptions<SurveySubmissionAttributes> = {}): FindOptions<SurveySubmissionAttributes> {
  const { sessionId, surveyId, userId } = scopeOps;
  const where: WhereOptions<SurveySubmissionAttributes> = {};

  if (surveyId)
    where.surveyId = surveyId;
  if (userId)
    where.userId = userId;
  if (sessionId)
    where.sessionId = sessionId;

  return {
    where,
    include: [
      {
        association: 'user',
        include: [
          { association: 'aliases', where, required: false },
          { association: 'customFields' },
        ],
      },
      { association: 'customFields' },
      {
        association: 'meals',
        include: [
          { association: 'customFields' },
          {
            association: 'foods',
            separate: true,
            include: [
              {
                association: 'customFields',
                separate: true,
              },
              {
                association: 'fields',
                separate: true,
              },
              {
                association: 'nutrients',
                separate: true,
                include: [{ association: 'nutrientType' }],
              },
              {
                association: 'portionSizes',
                separate: true,
              },
              {
                association: 'externalSources',
                separate: true,
              },
            ],
          },
          {
            association: 'missingFoods',
            separate: true,
            include: [
              { association: 'externalSources' },
            ],
          },
        ],
      },
      { association: 'survey', attributes: ['id', 'slug'] },
    ],
    order: [
      ['submissionTime', 'ASC'],
      ['meals', 'hours', 'ASC'],
      ['meals', 'minutes', 'ASC'],
    ],
    ...ops,
  };
}
