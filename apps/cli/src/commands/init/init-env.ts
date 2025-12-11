import path from 'node:path';

import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import webPush from 'web-push';

export type InitEnvArgs = { force?: boolean };

export default async (cmd: InitEnvArgs): Promise<void> => {
  const vapidKeys = webPush.generateVAPIDKeys();

  const apps = [
    {
      name: 'API',
      path: '../api',
      replacements: [
        { key: 'APP_SECRET', value: nanoid(64) },
        { key: 'JWT_ACCESS_SECRET', value: nanoid(64) },
        { key: 'JWT_ADMIN_REFRESH_SECRET', value: nanoid(64) },
        { key: 'JWT_SURVEY_REFRESH_SECRET', value: nanoid(64) },
        { key: 'WEBPUSH_PUBLIC_KEY', value: vapidKeys.publicKey },
        { key: 'WEBPUSH_PRIVATE_KEY', value: vapidKeys.privateKey },
      ],
    },
    {
      name: 'Admin',
      path: '../admin',
      replacements: [{ key: 'WEBPUSH_PUBLIC_KEY', value: vapidKeys.publicKey }],
    },
    { name: 'Survey', path: '../survey', replacements: [] },
    { name: 'CLI', path: '../cli', replacements: [] },
  ];

  for (const app of apps) {
    const templatePath = path.join(app.path, '.env-template');
    const templateExists = await fs.pathExists(templatePath);
    if (!templateExists)
      throw new Error(`Missing '.env-template' for '${app.name}' application.`);

    let content = await fs.readFile(templatePath, 'utf-8');

    const envFilePath = path.join(app.path, '.env');
    const envFileExists = await fs.pathExists(envFilePath);
    if (envFileExists && !cmd.force) {
      console.warn(`Env file '.env' already exists for '${app.name}' application.\n`);
      return;
    }

    for (const replacement of app.replacements) {
      const search = new RegExp(`${replacement.key}=.*\n`);
      const replace = `${replacement.key}=${replacement.value}\n`;
      content = content.replace(search, replace);
    }

    await fs.writeFile(envFilePath, content);
  }
};
