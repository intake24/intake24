import type { Options } from 'execa';

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as calver from 'calver';
import { execa } from 'execa';
import colors from 'picocolors';
import prompts from 'prompts';

import pkg from '../package.json';

function run(bin: string, args: string[], opts: Options = {}) {
  return execa(bin, args, { stdio: 'inherit', ...opts });
}

const step = (msg: string | number) => console.log(colors.cyan(msg));

function resolvePackages(path: string) {
  return readdirSync(resolve(path)).map(item => `${path}/${item}/package.json`);
}

function updatePackageVersion(path: string, version: string) {
  const pkgPath = resolve(path);
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  pkg.version = version;

  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function main() {
  const targetVersions = (['auto'] as calver.CalVerCycle[]).reduce<
    { title: string; value: string }[]
  >((acc, item) => {
    try {
      const value = calver.cycle(pkg.version, { cycle: item });

      acc.push({ title: `${item} | ${value}`, value });
    }
    catch {
      //
    }

    return acc;
  }, []);

  // Select release type
  const { version: targetVersion } = await prompts({
    type: 'select',
    name: 'version',
    message: `Select release type for ${colors.bold(pkg.name)}`,
    choices: targetVersions,
    initial: 0,
  });

  if (!targetVersion)
    return;

  // Update versions in package.json files
  step('\nUpdating versions in package.json files...');
  ['package.json', ...resolvePackages('apps'), ...resolvePackages('packages')]
    .filter(path => existsSync(path))
    .forEach(path => updatePackageVersion(path, targetVersion));

  step('\nGenerating the changelog...');
  await run('pnpm', ['changelog']);

  const { yes: allGood } = await prompts({
    type: 'confirm',
    name: 'yes',
    message: 'Is everything correct for push?',
  });

  if (!allGood)
    return;

  // Commit changes to the Git and create a tag.
  step('\nCommitting changes...');
  await run('git', ['add', '*package.json']);
  await run('git', ['commit', '-m', `release: v${targetVersion}`]);
  await run('git', ['tag', `v${targetVersion}`]);

  // Push to GitHub
  step('\nPushing to GitHub...');
  await run('git', ['push', 'origin', `refs/tags/v${targetVersion}`]);
  await run('git', ['push']);
}

main().catch((err) => {
  console.error(err);

  process.exitCode = process.exitCode ?? 1;
  process.exit();
});
