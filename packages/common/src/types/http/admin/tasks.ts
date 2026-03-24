import type { JobTypeParams } from '../../jobs';

import { isValidCron } from 'cron-validator';
import { z } from 'zod';

import { jobParams, jobTypeParams, jobTypes, repeatableBullJob } from '../../jobs';

export const taskAttributes = z.object({
  active: z.boolean(),
  createdAt: z.date(),
  cron: z.string().refine(val => isValidCron(val, { seconds: true })),
  description: z.string().nullable(),
  id: z.string(),
  job: z.enum(jobTypes),
  name: z.string().min(3).max(512),
  params: jobTypeParams,
  updatedAt: z.date(),
});

export const taskRequest = taskAttributes.pick({
  name: true,
  job: true,
  cron: true,
  active: true,
}).extend({
  description: z.string().nullish(),
  params: z.custom<JobTypeParams>(val => Object.prototype.toString.call(val) === '[object Object]'),
}).superRefine((val, ctx) => {
  const { success, error } = jobParams.shape[val.job].safeParse(val.params);
  if (!success) {
    error.issues.forEach((issue) => {
      issue.path.unshift('params');
      ctx.addIssue({ ...issue });
    });
  }
});

export type TaskRequest = z.infer<typeof taskRequest>;

export type TaskAttributes = z.infer<typeof taskAttributes>;

export const taskResponse = taskAttributes.extend({
  bullJob: repeatableBullJob.optional(),
});

export type TaskResponse = z.infer<typeof taskResponse>;
