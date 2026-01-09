import path from 'node:path';

import { createLogger, format, transports } from 'winston';

import config from './config';

import 'winston-daily-rotate-file';

export { Logger } from 'winston';

const consoleSilent = (process.env.NODE_ENV || 'development') === 'test';

const dirname = path.resolve(config.dir);

const logFormat = format.printf(({ level, message, timestamp, service, ...rest }) => {
  let msg = `${timestamp} ${level} ${service ? `${service}` : ''}: ${message}`;

  if (Object.keys(rest).length)
    msg = `${msg} ${JSON.stringify(rest)}`;

  return msg;
});

export const logger = createLogger({
  level: config.level,
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.DailyRotateFile({
      dirname,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
    }),
    new transports.DailyRotateFile({
      level: 'error',
      dirname,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
    }),
    new transports.Console({
      silent: consoleSilent,
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
      ),
    }),
  ],
  exitOnError: false,
});

export const httpLogger = {
  write: (message: string): void => {
    logger.child({ service: 'Http' }).info(message.trim());
  },
};

export function dbLogger(sql: string): void {
  logger.child({ service: 'Database' }).debug(sql);
}

export default logger;
