import childProcess from 'node:child_process';

import type { Environment } from '@intake24/common/types';

import pkg from '../../package.json';

export type Site = 'base' | 'admin' | 'survey' | 'images' | 'media' | 'docs';
export type SiteUrls = Record<Site, string>;

export type AppConfig = {
  env: Environment;

  name: string;
  icon?: string;
  fullName: string;
  poweredBy?: string;

  version: string;
  revision: string;
  fullVersion: string;

  host: string;
  port: number;
  https: boolean;
  certPath?: string;

  secret: string;

  urls: SiteUrls;
};

const host = 'localhost';
const port = 3100;
const https = !!(process.env.DEV_HTTPS === 'true');
const certPath = process.env.DEV_MKCERT_PATH;
const domain = `${https ? 'https' : 'http'}://${host}:${port}`;

const name = process.env.APP_NAME || 'Intake24';
const icon = process.env.APP_ICON || '🍴';
const fullName = [icon, name].filter(item => item).join(' ');

const revision = childProcess
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

const appConfig: AppConfig = {
  env: (process.env.NODE_ENV || 'development') as Environment,

  name,
  icon,
  fullName,
  poweredBy: process.env.APP_POWERED_BY,

  version: pkg.version,
  revision,
  fullVersion: `${pkg.version}-${revision}`,

  host: process.env.APP_HOST || host,
  port: process.env.APP_PORT ? Number.parseInt(process.env.APP_PORT, 10) : port,
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

export default appConfig;
