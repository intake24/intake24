import type { Express, Request, Response } from 'express';

import type { Ops } from '@intake24/api/app';
import type { Site } from '@intake24/api/config';

import path from 'node:path';

import express from 'express';
import helmet from 'helmet';

import { isUrlAbsolute } from '@intake24/api/util';

import api from './api';
import sites from './sites';

const apiHelmet = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

const staticContentHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      connectSrc: [
        '\'self\'',
        'https://hcaptcha.com',
        'https://*.hcaptcha.com',
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
        'https://*.googletagmanager.com',
      ],
      frameSrc: [
        '\'self\'',
        'https://hcaptcha.com',
        'https://*.hcaptcha.com',
        'https://www.google.com/recaptcha/',
        'https://recaptcha.google.com/recaptcha/',
        'https://youtube.com',
        'https://www.youtube.com',
      ],
      imgSrc: [
        '\'self\'',
        'blob:',
        'data:',
        'https://*.google-analytics.com',
        'https://*.googletagmanager.com',
      ],
      scriptSrc: [
        '\'self\'',
        'https://hcaptcha.com',
        'https://*.hcaptcha.com',
        'https://www.google.com/recaptcha/',
        'https://www.gstatic.com/recaptcha/',
        'https://storage.googleapis.com',
        'https://*.googletagmanager.com',
      ],
      styleSrc: [
        '\'self\'',
        'https://hcaptcha.com',
        'https://*.hcaptcha.com',
        '\'unsafe-inline\'', // TODO: review for Vuetify theming
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

function catchRestAs404(app: Express) {
  app.all('{*rest}', (req: Request, res: Response): void => {
    res.status(404).json('Invalid route');
  });
}

export default (app: Express, { config }: Ops): void => {
  /*
   * API routes - exclude CSP & cross origin policies
   */
  app.use('/api', apiHelmet, api());

  // Sites
  const { urls } = config.app;

  // No content hosted locally -> 404
  const localContent = Object.keys(urls).some(url => !isUrlAbsolute(url));
  if (!localContent) {
    catchRestAs404(app);
    return;
  }

  /*
   * Static sites - include CSP for static sites
   */
  app.use(staticContentHelmet);

  // Register common assets folder
  app.use(express.static(path.resolve('../../packages/common/src/theme/assets'), { index: false }));

  // Register images folder if locally hosted
  if (urls.images.startsWith(urls.base))
    app.use('/images', express.static(config.filesystem.local.images, { index: false }));

  // Register media folder if locally hosted
  if (urls.media.startsWith(urls.base) && config.media.storage.provider === 'local') {
    app.use('/media', express.static(config.media.storage.local.public, { index: false }));
  }

  // Check if any site is hosted locally
  const localSite = Object.keys(sites).some(site => !isUrlAbsolute(urls[site as Site]));
  if (!localSite) {
    catchRestAs404(app);
    return;
  }

  // Register global public folder if any site is locally hosted
  app.use(express.static(config.filesystem.local.public, { index: false }));

  // Register sites if they are locally hosted / relative URLs
  Object.entries(sites).forEach(([site, route]) => {
    if (!isUrlAbsolute(urls[site as Site]))
      app.use(urls[site as Site], route);
  });

  catchRestAs404(app);
};
