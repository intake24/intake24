import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import config from '../config/filesystem';

function makeScriptTag(url: string) {
  return '<script type="module" src=":url"></script>'.replace(':url', url);
}

function makeStylesheetTag(url: string) {
  return '<link rel="stylesheet" href=":url" />'.replace(':url', url);
}

function makeTag(url: string) {
  return url.match(/\.(css|sass|scss)$/)?.length ? makeStylesheetTag(url) : makeScriptTag(url);
}

export function vite(asset: string | string[], buildDir = 'build'): string {
  const assets = Array.isArray(asset) ? asset : [asset];

  const hotPath = resolve(config.local.public, 'hot');
  if (existsSync(hotPath)) {
    const hot = readFileSync(hotPath, { encoding: 'utf8' });

    return [
      makeScriptTag(`${hot}/@vite/client`),
      ...assets.map(item => makeTag(`${hot}/${item}`)),
    ].join('');
  }

  const segments = [config.local.public, buildDir, 'manifest.json'].filter(Boolean) as string[];

  const contents = readFileSync(resolve(...segments), { encoding: 'utf8' });
  const manifest = JSON.parse(contents);

  return assets.map(item => makeTag(`${buildDir}/${manifest[item].file ?? item}`)).join('');
}
