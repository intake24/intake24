import type { NextFunction, Request, Response } from 'express';

import type { RequestIoC } from '@intake24/api/ioc';

import ioc from '@intake24/api/ioc';

export function registerIoC(req: Request, res: Response, next: NextFunction): void {
  req.scope = ioc.createScope<RequestIoC>();

  next();
}
