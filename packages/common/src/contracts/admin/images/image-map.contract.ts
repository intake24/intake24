import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  createImageMapRequest,
  imageMapEntry,
  imageMapListEntry,
  updateImageMapInput,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const imageMap = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/images/image-maps',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: imageMapListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse image maps',
    description: 'Browse image maps (paginated list)',
  },
  store: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/images/image-maps',
    body: createImageMapRequest,
    responses: {
      201: imageMapEntry,
    },
    summary: 'Create image map',
    description: 'Create new image map',
  },
  read: {
    method: 'GET',
    path: '/admin/images/image-maps/:imageMapId',
    responses: {
      200: imageMapEntry,
    },
    summary: 'Get image map',
    description: 'Get image map by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/images/image-maps/:imageMapId',
    body: updateImageMapInput,
    responses: {
      200: imageMapEntry,
    },
    summary: 'Update image map',
    description: 'Update image map by id',
  },
  updateImage: {
    method: 'PUT',
    contentType: 'multipart/form-data',
    path: '/admin/images/image-maps/:imageMapId/base-image',
    body: null,
    responses: {
      200: imageMapEntry,
    },
    summary: 'Update base image of image map',
    description: 'Update base image of image map by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/images/image-maps/:imageMapId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete image map',
    description: 'Delete image map by id',
  },
});
