import type { AwilixContainer } from 'awilix';
import type { RequestIoC } from './ioc';

import { asClass } from 'awilix';
import type { Job } from '@intake24/api/jobs';
import jobs from '@intake24/api/jobs';

export default (container: AwilixContainer<RequestIoC>): void => {
  for (const [name, job] of Object.entries(jobs))
    container.register({ [name]: asClass<Job<any>>(job) });
};
