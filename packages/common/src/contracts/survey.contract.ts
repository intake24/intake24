import { initContract } from '@ts-rest/core';
import validator from 'validator';

import { captcha, createUserResponse, generateUserResponse, publicSurveyEntry } from '../types/http';
import { z } from '../util';

export const survey = initContract().router({
  browse: {
    method: 'GET',
    path: '/surveys',
    responses: {
      200: publicSurveyEntry.array(),
    },
    summary: 'Browse surveys',
    description: 'Publicly accessible survey list. Returns list of public surveys.',
  },
  entry: {
    method: 'GET',
    path: '/surveys/:slug',
    query: z.object({
      survey: z.string().optional(),
    }),
    responses: {
      200: publicSurveyEntry,
    },
    summary: 'Get survey entry',
    description:
      'Returns survey parameters necessary to render the survey login page such as the language settings and the support e-mail.',
  },
  generateUser: {
    method: 'POST',
    path: '/surveys/:slug/generate-user',
    body: z.object({ captcha }),
    responses: {
      200: generateUserResponse,
    },
    summary: 'Generate user',
    description:
      'Generate user for survey public survey. Automatically create a new user account with a respondent role and random credentials if allowed by the survey settings.',
  },
  createUser: {
    method: 'POST',
    path: '/surveys/:slug/create-user',
    body: z.object({
      token: z.string().refine(value => validator.isJWT(value), { message: 'Token must be a valid JWT' }),
    }),
    responses: {
      200: createUserResponse,
    },
    summary: 'Create user',
    description:
      'Create user for survey survey using JWT encoded parameters. Payload must be a valid JWT token signed with secret set up in survey settings.',
  },
});
