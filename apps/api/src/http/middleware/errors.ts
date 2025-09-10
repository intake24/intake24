import type { Express, NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { Ops } from '@intake24/api/app';
import { IndexNotReadyError } from '@intake24/api/food-index';
import { InvalidIdError } from '@intake24/api/services';
import { DatabaseError } from '@intake24/db';
import {
  ApplicationError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  mapZodIssues,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors';

export default (app: Express, { logger }: Ops): void => {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApplicationError || err instanceof SyntaxError) {
      const { message } = err;
      res.status(400).json({ message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof UnauthorizedError) {
      const { message } = err;
      res.status(401).json({ message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ForbiddenError) {
      const { message } = err;
      res.status(403).json({ message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof NotFoundError || err instanceof InvalidIdError) {
      const { message } = err;
      res.status(404).json({ message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ConflictError) {
      const { message } = err;
      res.status(409).json({ message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ValidationError) {
      const { message, code } = err;
      res.status(code).json({ errors: err.getErrors(req.scope.cradle.i18nService), message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      const { details, message } = fromZodError(err);
      res.status(400).json({ errors: mapZodIssues(details), message });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof MulterError) {
      const { field = 'file', message } = err;

      res.status(400).json({
        errors: { [field]: { param: field, msg: message, location: 'body', value: null } },
        message,
      });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof InternalServerError) {
      const { message, name, stack } = err;
      logger.error(`${name}: ${message}`, { stack });
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof DatabaseError) {
      const { message, name, stack } = err.original;
      logger.error(`${name}: ${message}`, { stack });
      res.status(503).json({ message: 'Internal Database Error' });
      return;
    }

    if (err instanceof IndexNotReadyError) {
      const { message, name, stack } = err;
      logger.error(`${name}: ${message}`, { stack });
      res.status(503).json({ message: 'Internal Server Error' });
      return;
    }
    next(err);
  });

  // Express error middleware is identified by this params pattern, keep all
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const { message, name, stack } = err;
    logger.error(`${name}: ${message}`, { stack });
    res.status(500).json({ message: 'Internal Server Error' });
  });
};
