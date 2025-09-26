import type { AxiosResponse } from 'axios';
import type winston from 'winston';
import { HttpStatusCode } from 'axios';

export interface CreateSuccess<T> {
  type: 'success';
  data: T;
}

export interface CreateConflict<T> {
  type: 'conflict';
  details: T;
}

export type CreateResult<T, CT = any> = CreateSuccess<T> | CreateConflict<CT>;

export function parseCreateResponse<T, CT = any>(
  response: AxiosResponse<T>,
  logger: winston.Logger,
  request?: any,
): CreateResult<T, CT> {
  if (response.status === HttpStatusCode.Ok || response.status === HttpStatusCode.Created) {
    return {
      type: 'success',
      data: response.data,
    };
  }
  else if (response.status === HttpStatusCode.Conflict) {
    return {
      type: 'conflict',
      details: response.data as unknown as CT,
    };
  }
  else {
    let detail: string | undefined;
    if (response.data && typeof response.data === 'object') {
      const data = response.data as Record<string, unknown>;
      if (typeof data.message === 'string')
        detail = data.message;
      else if (typeof data.error === 'string')
        detail = data.error;
    }

    const method = response.request?.method ?? response.config.method ?? 'REQUEST';
    const url = response.request?.path ?? response.config.url ?? 'unknown URL';
    const baseMessage = `Unexpected HTTP status: ${response.status} for ${method} ${url}`;
    const message = detail ? `${baseMessage} - ${detail}` : baseMessage;

    logger.error(message);

    if (response.data !== undefined)
      logger.error(`Response body: ${JSON.stringify(response.data, null, 2)}`);

    if (request !== undefined)
      logger.error(`Request body: ${JSON.stringify(request, null, 2)}`);

    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).detail = detail ?? response.data;

    throw error;
  }
}
