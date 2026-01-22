import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  createGuideImageInput,
  guideImageEntry,
  guideImageListEntry,
  updateGuideImageInput,
} from '@intake24/common/types/http/admin';

const contract = initContract();

export const guideImage = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/images/guide-images',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: guideImageListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse guide images',
    description: 'Browse guide images (paginated list)',
  },
  store: {
    method: 'POST',
    contentType: 'multipart/form-data',
    path: '/admin/images/guide-images',
    body: createGuideImageInput,
    responses: {
      201: guideImageEntry,
    },
    summary: 'Create guide image',
    description: 'Create new guide image',
  },
  read: {
    method: 'GET',
    path: '/admin/images/guide-images/:guideImageId',
    responses: {
      200: guideImageEntry,
    },
    summary: 'Get guide image',
    description: 'Get guide image by id',
  },
  update: {
    method: 'PUT',
    path: '/admin/images/guide-images/:guideImageId',
    body: updateGuideImageInput,
    responses: {
      200: guideImageEntry,
    },
    summary: 'Update guide image',
    description: 'Update guide image by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/images/guide-images/:guideImageId',
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete guide image',
    description: 'Delete guide image by id',
  },
});
