import type { JobType } from '@intake24/common/types';

import feedbackSchemes from './feedback-schemes';
import io from './io';
import languages from './languages';
import locales from './locales';
import nutrientTables from './nutrient-tables';
import search from './search';
import surveySchemes from './survey-schemes';
import surveys from './surveys';
import system from './system';
import user from './user';

export * from './job';
export { default as Job } from './job';
export { default as NotificationJob } from './notification-job';
export { default as StreamLockJob } from './stream-lock-job';

const jobs = {
  ...feedbackSchemes,
  ...languages,
  ...locales,
  ...nutrientTables,
  ...search,
  ...surveySchemes,
  ...surveys,
  ...system,
  ...user,
  ...io,
};

export type Jobs = {
  [P in JobType]: new (...args: any[]) => (typeof jobs)[P];
};

export default jobs;
