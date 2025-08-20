import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import { createMediaWithModelRequest, mediaEntry, updateMediaWithModelRequest } from '@intake24/common/types/http/admin';

export const media = initContract().router({
  browse: {
    method: 'GET',
    path: '/admin/media',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: mediaEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse media',
    description: 'Browse media (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/media',
    body: createMediaWithModelRequest,
    responses: {
      201: mediaEntry,
    },
    summary: 'Upload media',
    description: 'Upload new media',
  },
  read: {
    method: 'GET',
    path: '/admin/media/:mediaId',
    pathParams: z.object({ mediaId: z.string().uuid() }),
    responses: {
      200: mediaEntry,
    },
    summary: 'Update media',
    description: 'Update media',
  },
  update: {
    method: 'PATCH',
    path: '/admin/media/:mediaId',
    pathParams: z.object({ mediaId: z.string().uuid() }),
    body: updateMediaWithModelRequest,
    responses: {
      200: mediaEntry,
    },
    summary: 'Update media',
    description: 'Update media',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/media/:mediaId',
    pathParams: z.object({ mediaId: z.string().uuid() }),
    body: null,
    responses: {
      204: z.undefined(),
    },
    summary: 'Remove media',
    description: 'Remove media',
  },
});
