import { existsSync } from 'node:fs';
import path from 'node:path';

import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import fsConfig from '@intake24/api/config/filesystem';

export default () => {
  it('get / should render when SPA app if deployed', async () => {
    const exists = existsSync(path.resolve(fsConfig.local.public, 'survey', 'index.html'));

    const res = await request(suite.app).get('/').set('Accept', 'application/json');

    expect(res.status).toBe(exists ? 200 : 404);
  });

  it('get /some-existing-route render when SPA app if deployed', async () => {
    const exists = existsSync(path.resolve(fsConfig.local.public, 'survey', 'index.html'));

    const res = await request(suite.app)
      .get('/some-existing-route')
      .set('Accept', 'application/json');

    expect(res.status).toBe(exists ? 200 : 404);
  });
};
