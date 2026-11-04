import { z } from 'zod';

import { usernameSchema } from '@intake24/common/security';

import { userAttributes, userCustomFieldAttributes, userRequest, userSurveyAliasAttributes } from './users';

export const respondentEntry = z.object({
  ...userSurveyAliasAttributes.omit({
    createdAt: true,
    updatedAt: true,
  }).shape,
  ...userAttributes.pick({
    name: true,
    email: true,
    phone: true,
  }).shape,
  customFields: userCustomFieldAttributes.array(),
  surveyAuthUrl: z.string(),
  feedbackAuthUrl: z.string(),
});
export type RespondentEntry = z.infer<typeof respondentEntry>;

export const respondentListEntry = userSurveyAliasAttributes.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  surveyAuthUrl: z.string(),
  feedbackAuthUrl: z.string(),
});

export type RespondentListEntry = z.infer<typeof respondentListEntry>;

export const respondentRequest = userRequest.pick({
  name: true,
  email: true,
  phone: true,
  customFields: true,
  password: true,
  passwordConfirm: true,
});

export type RespondentRequest = z.infer<typeof respondentRequest>;

export const createRespondentRequest = respondentRequest.extend({
  username: usernameSchema,
}).refine(data => data.username !== data.password, {
  message: 'Username and password must not be the same',
  path: ['password'],
});

export type CreateRespondentRequest = z.infer<typeof createRespondentRequest>;
