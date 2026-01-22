import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const contract = initContract();

export const foodThumbnailImages = contract.router({
  update: {
    method: 'PUT',
    path: '/admin/fdbs/:localeId/:foodCode/thumbnail',
    contentType: 'multipart/form-data',
    body: z.object({
      image: z.custom<File>(),
    }),
    pathParams: z.object({ localeId: z.string(), foodCode: z.string() }),
    responses: {
      200: contract.noBody(),
      404: contract.noBody(),
    },
    summary: 'Update food image thumbnail',
    description: 'Update food image thumbnail',
  },
});
