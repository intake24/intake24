import type { Express, Request } from 'express';
import cors, { CorsOptions, CorsOptionsDelegate } from 'cors';

import type { Ops } from '@intake24/api/app';

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
  const defaultCorsOptions: CorsOptions = {
    origin,
    credentials: true,
    exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'],
  };

  const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
    const corsOptions = { ...defaultCorsOptions };

    if (req.path === '/api/admin/large-file-upload') {
      corsOptions.preflightContinue = true;
    }

    callback(null, corsOptions);
  };

  app.use(
    cors(corsOptionsDelegate),
  );

  // preflightContinue option will always try to call the OPTIONS handler even
  // if there isn't one and return 404 in this case.
};
