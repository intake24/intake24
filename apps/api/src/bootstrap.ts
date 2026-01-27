import fs from 'node:fs';
import { resolve } from 'node:path';

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

function checkEnvFileExists(path: string): void {
  try {
    fs.accessSync(path);
  }
  catch (err) {
    throw new Error(`.env file does not exist -- expected at ${path}\n\nSee https://docs.intake24.org/config/\n`, { cause: err });
  }
}

const envFilePath
  = process.env.NODE_ENV === 'test' ? resolve(import.meta.dirname, '../__tests__/.env-test') : resolve(import.meta.dirname, '../.env');

checkEnvFileExists(envFilePath);

const options
  = process.env.NODE_ENV === 'test' ? { path: envFilePath } : undefined;

const dotEnv = dotenv.config(options);
dotenvExpand.expand(dotEnv);
