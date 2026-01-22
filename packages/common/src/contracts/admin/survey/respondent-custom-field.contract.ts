import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { userCustomField } from '@intake24/common/types';
import { paginationMeta, paginationRequest, bigIntString as surveyId } from '@intake24/common/types/http';
import { userCustomFieldAttributes } from '@intake24/common/types/http/admin';

const contract = initContract();

export const respondentCustomField = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/respondents/:username/custom-fields',
    pathParams: z.object({ surveyId }),
    query: paginationRequest,
    responses: {
      200: z.object({
        data: userCustomFieldAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse respondents custom fields',
    description: 'Browse survey custom fields (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/surveys/:surveyId/respondents/:username/custom-fields',
    pathParams: z.object({ surveyId }),
    body: userCustomField,
    responses: {
      201: userCustomFieldAttributes,
    },
    summary: 'Create respondent custom field',
    description: 'Create new respondent custom field',
  },
  read: {
    method: 'GET',
    path: '/admin/surveys/:surveyId/respondents/:username/custom-fields/:field',
    pathParams: z.object({ surveyId }),
    responses: {
      200: userCustomFieldAttributes,
    },
    summary: 'Get respondent custom field',
    description: 'Get survey respondent custom field',
  },
  update: {
    method: 'PATCH',
    path: '/admin/surveys/:surveyId/respondents/:username/custom-fields/:field',
    pathParams: z.object({ surveyId }),
    body: userCustomField.pick({ value: true, public: true }),
    responses: {
      200: userCustomFieldAttributes,
    },
    summary: 'Update respondent custom field',
    description: 'Update survey respondent custom field',
  },
  upsert: {
    method: 'PUT',
    path: '/admin/surveys/:surveyId/respondents/:username/custom-fields/:field',
    pathParams: z.object({ surveyId }),
    body: userCustomField.pick({ value: true, public: true }),
    responses: {
      200: userCustomFieldAttributes,
      201: userCustomFieldAttributes,
    },
    summary: 'Create or update respondent custom field',
    description: 'Create or update survey respondent custom field',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/surveys/:surveyId/respondents/:username/custom-fields/:field',
    pathParams: z.object({ surveyId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete respondent custom field',
    description: 'Delete survey respondent custom field',
  },
});
