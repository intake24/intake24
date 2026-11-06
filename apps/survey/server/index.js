/* eslint-disable perfectionist/sort-imports */
import './bootstrap.js';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import config from './config.js';

async function startApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    helmet({
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
            config.api.host,
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
            config.api.host,
            config.api.cdn,
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
    }),
  );

  app.use(express.static(config.static, { index: false }));

  app.get('{*rest}', (req, res) => {
    const index = path.resolve(config.static, 'index.html');

    fs.access(index, fs.constants.F_OK, (err) => {
      if (err) {
        res.status(404).send();
        return;
      }

      res.sendFile(index);
    });
  });

  // Start listening
  app.listen(config.port, config.url, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`${config.name} is listening on port ${config.port}!`);
  });
}

(async () => {
  await startApp();
})();
