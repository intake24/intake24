import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

import { Readable } from 'node:stream';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import fs from 'fs-extra';
import { SitemapStream } from 'sitemap';

const env = dotenv.config();
dotenvExpand.expand(env);

try {
  const hostname = process.env.APP_URL;
  if (!hostname)
    throw new Error('Missing hostname');

  const publicPath = process.env.FS_PUBLIC || 'public';
  await fs.ensureDir(resolve(publicPath));

  const stream = new SitemapStream({ hostname });

  const links = [
    { url: '/', changefreq: 'daily', priority: 0.9 },
    { url: '/contacts', changefreq: 'daily', priority: 0.8 },
    { url: '/features', changefreq: 'daily', priority: 0.8 },
    { url: '/feedback', changefreq: 'daily', priority: 0.8 },
    { url: '/localisation', changefreq: 'daily', priority: 0.8 },
    { url: '/open-source', changefreq: 'daily', priority: 0.8 },
    { url: '/output', changefreq: 'daily', priority: 0.8 },
    { url: '/publications', changefreq: 'daily', priority: 0.8 },
    { url: '/recall', changefreq: 'daily', priority: 0.8 },
    { url: '/validation', changefreq: 'daily', priority: 0.8 },
    { url: '/privacy', changefreq: 'daily', priority: 0.7 },
    { url: '/terms', changefreq: 'daily', priority: 0.7 },
  ];

  Readable.from(links)
    .pipe(stream)
    .pipe(createWriteStream(resolve(`${publicPath}/sitemap.xml`)))
    .on('error', (err) => {
      throw err;
    });
}
catch (err) {
  console.error(err);
}
