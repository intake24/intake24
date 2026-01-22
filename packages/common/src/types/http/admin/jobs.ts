import type { JobTypeParams } from '../../jobs';

import type { Pagination } from '../generic';

import { z } from 'zod';
import { jobParams, jobTypeParams, jobTypes, userTasks } from '../../jobs';
import { userAttributes } from './users';

export const jobAttributes = z.object({
  id: z.string(),
  type: z.enum(jobTypes),
  userId: z.string().nullable(),
  downloadUrl: z.string().nullable(),
  downloadUrlExpiresAt: z.date().nullable(),
  progress: z.number().nullable(),
  successful: z.boolean().nullable(),
  message: z.string().nullable(),
  params: jobTypeParams,
  stackTrace: z.string().array().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: userAttributes.optional(),
});
export type JobAttributes = z.infer<typeof jobAttributes>;

export const repeatJobRequest = jobAttributes.pick({
  type: true,
}).extend({
  params: z.custom<JobTypeParams>(() => {
    return true;
  }),
}).partial().superRefine(
  (val, ctx) => {
    if (!val.type && !val.params)
      return;

    if (!val.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Job type is required',
        path: ['type'],
      });
      return;
    }

    const { success, error } = jobParams.shape[val.type].safeParse(val.params);
    if (!success) {
      error.issues.forEach((issue) => {
        issue.path.unshift('params');
        ctx.addIssue({ ...issue });
      });
    }
  },
);
export type RepeatJobRequest = z.infer<typeof repeatJobRequest>;

export type JobsResponse = Pagination<JobAttributes>;

export const userJobRequest = userTasks;
export type UserJobRequest = z.infer<typeof userJobRequest>;
