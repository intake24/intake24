import childProcess from 'node:child_process';

import z from 'zod';

import { environmentOptions } from '@intake24/common/types';
import pkg from '../../package.json';
import { validateConfig } from './validate-config';

export type Site = 'base' | 'admin' | 'survey' | 'images' | 'media' | 'docs';
export type SiteUrls = Record<Site, string>;

export const appConfigSchema = z.object({
  env: z.enum(environmentOptions),

  name: z.string(),
  icon: z.string().optional(),
  fullName: z.string(),
  poweredBy: z.string().optional(),

  version: z.string(),
  revision: z.string(),
  fullVersion: z.string(),

  host: z.string(),
  port: z.coerce.number().int().positive(),
  https: z.boolean(),
  certPath: z.string().optional(),

  secret: z.string().nonempty(),

  urls: z.object({
    base: z.string(),
    admin: z.string(),
    survey: z.string(),
    images: z.string(),
    media: z.string(),
    docs: z.string(),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

const host = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT ? Number.parseInt(process.env.APP_PORT, 10) : 3100;
const https = !!(process.env.DEV_HTTPS === 'true');
const certPath = process.env.DEV_MKCERT_PATH;
const domain = `${https ? 'https' : 'http'}://${host}:${port}`;

const name = process.env.APP_NAME || 'Intake24';
const icon = process.env.APP_ICON || '🍴';
const fullName = [icon, name].filter(item => item).join(' ');

let revision = 'rev-unknown';

try {
  revision = childProcess
    .execSync('git rev-parse --short HEAD')
    .toString()
    .trim();
}
catch {
  // empty catch clause intentional
}

const rawAppConfig = {
  env: process.env.NODE_ENV || 'development',

  name,
  icon,
  fullName,
  poweredBy: process.env.APP_POWERED_BY,

  version: pkg.version,
  revision,
  fullVersion: `${pkg.version}-${revision}`,

  host,
  port,
  https,
  certPath,

  secret: process.env.APP_SECRET || '',

  urls: {
    base: process.env.APP_URL_BASE || domain,
    admin: process.env.APP_URL_ADMIN || '/admin',
    survey: process.env.APP_URL_SURVEY || '/survey',
    images: process.env.APP_URL_IMAGES || `${domain}/images`,
    media: process.env.APP_URL_MEDIA || `${domain}/media`,
    docs: process.env.APP_URL_DOCS || '/docs',
  },
};

const parsedAppConfig = validateConfig('App configuration', appConfigSchema, rawAppConfig);

export default parsedAppConfig;
