import validator from 'validator';
import { z } from 'zod';

import { userAttributes, userCustomFieldAttributes, userRequest, userSurveyAliasAttributes } from './users';

export const respondentEntry = userSurveyAliasAttributes.omit({
  createdAt: true,
  updatedAt: true,
}).merge(userAttributes.pick({
  name: true,
  email: true,
  phone: true,
})).extend({
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
  username: z.string().min(1).max(256).refine(val => !validator.isEmail(val)),
});

export type CreateRespondentRequest = z.infer<typeof createRespondentRequest>;
