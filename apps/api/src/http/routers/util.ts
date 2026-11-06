import type { Response } from 'express';

import type { CookieSettings } from '@intake24/api/config/common';

export function attachRefreshToken(token: string, res: Response, cookie: CookieSettings) {
  const { name, httpOnly, maxAge, path, secure, sameSite } = cookie;

  res.cookie(name, token, {
    maxAge,
    httpOnly,
    path,
    sameSite,
    secure,
  });
}
