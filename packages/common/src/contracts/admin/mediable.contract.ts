import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import type { MediaModel } from '@intake24/common/types/http/admin';
import { createMediaRequest, mediaEntry, updateMediaRequest } from '@intake24/common/types/http/admin';

export function mediable(mediable: MediaModel, prefix: string) {
  return initContract().router({
    browse: {
      method: 'GET',
      path: `${prefix}/media`,
      query: paginationRequest,
      responses: {
        200: z.object({
          data: mediaEntry.array(),
          meta: paginationMeta,
        }),
      },
      summary: `${mediable}: Browse media`,
      description: `${mediable}: Browse media (paginated list)`,
    },
    store: {
      method: 'POST',
      path: `${prefix}/media`,
      body: createMediaRequest,
      responses: {
        201: mediaEntry,
      },
      summary: `${mediable}: Upload media`,
      description: `${mediable}: Upload new media`,
    },
    read: {
      method: 'GET',
      path: `${prefix}/media/:mediaId`,
      pathParams: z.object({ mediaId: z.string().uuid() }),
      responses: {
        200: mediaEntry,
      },
      summary: `${mediable}: Update media`,
      description: `${mediable}: Update media`,
    },
    update: {
      method: 'PATCH',
      path: `${prefix}/media/:mediaId`,
      pathParams: z.object({ mediaId: z.string().uuid() }),
      body: updateMediaRequest,
      responses: {
        200: mediaEntry,
      },
      summary: `${mediable}: Update media`,
      description: `${mediable}: Update media`,
    },
    destroy: {
      method: 'DELETE',
      path: `${prefix}/media/:mediaId`,
      pathParams: z.object({ mediaId: z.string().uuid() }),
      body: null,
      responses: {
        204: z.undefined(),
      },
      summary: `${mediable}: Remove media`,
      description: `${mediable}: Remove media`,
    },
  });
}

export type MediableContract = ReturnType<typeof mediable>;
