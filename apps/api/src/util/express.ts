import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AsyncRequestHandler } from '@intake24/api/http/controllers';

export function wrapAsync(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): Promise<void> =>
    fn(req, res, next).catch(next);
}

/**
 * Aborts when the client disconnects.
 */
export function abortOnClose(req: Request, res: Response): AbortSignal {
  const abortController = new AbortController();
  res.on('close', () => abortController.abort());
  if (req.socket.destroyed)
    abortController.abort();

  return abortController.signal;
}
