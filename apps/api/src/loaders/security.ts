import type { Express } from 'express';
import cors from 'cors';

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
  app.use(
    cors({
      origin,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After',
        // For Tus protocol OPTIONS request
        'Upload-Offset', 'Location', 'Upload-Length', 'Tus-Version', 'Tus-Resumable', 'Tus-Max-Size', 'Tus-Extension', 'Upload-Metadata', 'Upload-Defer-Length', 'Upload-Concat'],
    }),
  );
};
