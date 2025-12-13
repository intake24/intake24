import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const env = dotenv.config({
  path: ['.env', '../api/.env'],
  quiet: true,
});
dotenvExpand.expand(env);
