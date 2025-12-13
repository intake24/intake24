import path from 'node:path';
import { log } from '@clack/prompts';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import webPush from 'web-push';

type App = 'api' | 'admin' | 'survey' | 'cli';
type InitEnvArgs = {
  apps: App[];
  override: boolean;
  secrets: boolean;
  vapid: boolean;
};
type AppInfo = {
  name: App;
  path: string;
  replacements: {
    secrets?: { key: string; value: string }[];
    vapid?: { key: string; value: string }[];
  };
};

export default async (args: InitEnvArgs): Promise<void> => {
  const vapidKeys = webPush.generateVAPIDKeys();

  const apps: AppInfo[] = [
    {
      name: 'api',
      path: '../api',
      replacements: {
        secrets: [
          { key: 'APP_SECRET', value: nanoid(64) },
          { key: 'JWT_ACCESS_SECRET', value: nanoid(64) },
          { key: 'JWT_ADMIN_REFRESH_SECRET', value: nanoid(64) },
          { key: 'JWT_SURVEY_REFRESH_SECRET', value: nanoid(64) },
        ],
        vapid: [
          { key: 'WEBPUSH_PUBLIC_KEY', value: vapidKeys.publicKey },
          { key: 'WEBPUSH_PRIVATE_KEY', value: vapidKeys.privateKey },
        ],
      },
    },
    {
      name: 'admin',
      path: '../admin',
      replacements: {
        vapid: [
          { key: 'WEBPUSH_PUBLIC_KEY', value: vapidKeys.publicKey },
        ],
      },
    },
    { name: 'survey', path: '../survey', replacements: {} },
    { name: 'cli', path: '../cli', replacements: {} },
  ];

  for (const app of apps) {
    if (!args.apps.includes(app.name))
      continue;

    const templatePath = path.join(app.path, '.env-template');
    const templateExists = await fs.pathExists(templatePath);
    if (!templateExists) {
      log.error(`Missing '.env-template' for '${app.name}' application in '${app.path}'. \nPlease check the file availability before proceeding.`);
      return;
    }

    let content = await fs.readFile(templatePath, 'utf-8');

    const envFilePath = path.join(app.path, '.env');
    const envFileExists = await fs.pathExists(envFilePath);
    if (envFileExists) {
      if (args.override) {
        log.warn(`Env file '.env' already exists for '${app.name}' application, overriding as requested.`);
      }
      else {
        await fs.copyFile(envFilePath, `${envFilePath}.backup.${Date.now()}`);
        log.info(`Env file '.env' already exists for '${app.name}' application, backup created.`);
      }
    }

    for (const item of ['secrets', 'vapid'] as const) {
      if (args[item] && app.replacements[item]?.length) {
        for (const replacement of app.replacements[item]) {
          const search = new RegExp(`${replacement.key}=.*\n`);
          const replace = `${replacement.key}=${replacement.value}\n`;
          content = content.replace(search, replace);
        }
      }
    }

    await fs.writeFile(envFilePath, content);
    log.success(`Created '.env' for '${app.name}' application.`);
  }
};
