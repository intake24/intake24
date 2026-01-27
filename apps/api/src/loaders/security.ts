import type { Express } from 'express';

import type { Ops } from '@intake24/api/app';

import cors from 'cors';

export default (app: Express, { config }: Ops) => {
  const {
    cors: { origin },
    proxy,
  } = config.security;

  // X-powered-by header
  app.disable('x-powered-by');

  // Trusted proxies
  app.set('trust proxy', proxy);

  // E-tags
  app.set('etag', false);

  // CORS
  app.use(
    cors({
      origin,
      credentials: true,
      exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'],
    }),
  );
};
