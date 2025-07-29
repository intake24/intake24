import type { AwilixContainer } from 'awilix';
import { asClass } from 'awilix';

import type { Job } from '@intake24/api/jobs';
import jobs from '@intake24/api/jobs';
import { RequestIoC } from './ioc';

export default (container: AwilixContainer<RequestIoC>): void => {
  for (const [name, job] of Object.entries(jobs))
    container.register({ [name]: asClass<Job<any>>(job) });
};
