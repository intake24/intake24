import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AsyncRequestHandler } from '@intake24/api/http/controllers';

export function wrapAsync(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): Promise<void> =>
    fn(req, res, next).catch(next);
}
