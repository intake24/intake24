import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as faqId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import { faqEntry, faqRequest } from '@intake24/common/types/http/admin';

const contract = initContract();

export const faq = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/faqs',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: faqEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse faqs',
    description: 'Browse faqs (paginated list)',
  },
  store: {
    method: 'POST',
    path: '/admin/faqs',
    body: faqRequest,
    responses: {
      201: faqEntry,
    },
    summary: 'Create faq',
    description: 'Create new faq',
  },
  read: {
    method: 'GET',
    path: '/admin/faqs/:faqId',
    pathParams: z.object({ faqId }),
    responses: {
      200: faqEntry,
    },
    summary: 'Get faq',
    description: 'Get faq by id',
  },
  put: {
    method: 'PUT',
    path: '/admin/faqs/:faqId',
    pathParams: z.object({ faqId }),
    body: faqRequest,
    responses: {
      200: faqEntry,
    },
    summary: 'Update faq',
    description: 'Update faq by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/faqs/:faqId',
    pathParams: z.object({ faqId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete faq',
    description: 'Delete faq by id',
  },
  copy: {
    method: 'POST',
    path: '/admin/faqs/:faqId/copy',
    pathParams: z.object({ faqId }),
    body: faqRequest.pick({ name: true }),
    responses: {
      200: faqEntry,
    },
    summary: 'Copy faq',
    description: 'Copy faq record',
  },
});
