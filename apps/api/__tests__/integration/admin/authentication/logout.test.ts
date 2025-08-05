import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';
import securityConfig from '@intake24/api/config/security';

export default () => {
  const url = '/api/admin/auth/logout';

  it('should return 200 and empty refresh cookie', async () => {
    const res = await request(suite.app).post(url).set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toBeEmpty();

    expect(res.get('Set-Cookie')?.length).toBeGreaterThanOrEqual(1);
    expect(
      (res.get('Set-Cookie') ?? []).some(
        cookie => cookie.split('=')[0] === securityConfig.jwt.admin.cookie.name,
      ),
    ).toBe(true);
  });
};
