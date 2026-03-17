import type { JobTypeParams } from '../../jobs';

import { isValidCron } from 'cron-validator';
import { z } from 'zod';

import { defaultJobsParams, jobParams, jobTypes, repeatableBullJob } from '../../jobs';

export const taskRequest = z.object({
  name: z.string().min(3).max(512),
  job: z.enum(jobTypes),
  cron: z.string().refine(val => isValidCron(val, { seconds: true })),
  active: z.boolean(),
  description: z.string().nullish(),
  params: z.custom<JobTypeParams>(val => typeof val === 'object' && val !== null && !Array.isArray(val)),
}).superRefine((val, ctx) => {
  const rawParams = typeof val.params === 'object' && val.params !== null ? val.params : {};
  const params = { ...defaultJobsParams[val.job], ...rawParams };

  const { success, error } = jobParams.shape[val.job].safeParse(params);
  if (success)
    return;

  error.issues.forEach((issue) => {
    issue.path.unshift('params');
    ctx.addIssue({ ...issue });
  });
});

export type TaskRequest = z.infer<typeof taskRequest>;

export const taskAttributes = z.object({
  active: z.boolean(),
  createdAt: z.date(),
  cron: z.string(),
  description: z.string().nullable(),
  id: z.string(),
  job: z.enum(jobTypes),
  name: z.string(),
  params: z.custom<JobTypeParams>(val => typeof val === 'object' && val !== null && !Array.isArray(val)),
  updatedAt: z.date(),
}).superRefine((val, ctx) => {
  const rawParams = typeof val.params === 'object' && val.params !== null ? val.params : {};
  const params = { ...defaultJobsParams[val.job], ...rawParams };

  const { success, error } = jobParams.shape[val.job].safeParse(params);
  if (success)
    return;

  error.issues.forEach((issue) => {
    issue.path.unshift('params');
    ctx.addIssue({ ...issue });
  });
});

export type TaskAttributes = z.infer<typeof taskAttributes>;

export const taskResponse = taskAttributes.extend({
  bullJob: repeatableBullJob.optional(),
});

export type TaskResponse = z.infer<typeof taskResponse>;
