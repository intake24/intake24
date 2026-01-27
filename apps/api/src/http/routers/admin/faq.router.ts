import type { WhereOptions } from 'sequelize';

import type { PaginateOptions } from '@intake24/db';

import { initServer } from '@ts-rest/express';
import { col, fn, Op } from 'sequelize';

import { ForbiddenError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { faqResponse } from '@intake24/api/http/responses/admin';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { FAQ, securableScope, UserSecurable } from '@intake24/db';

async function uniqueMiddleware(value: any, { faqId }: { faqId?: string } = {}) {
  const where: WhereOptions = faqId ? { id: { [Op.ne]: faqId } } : {};

  if (!(await unique({ model: FAQ, condition: { field: 'name', value }, options: { where } }))) {
    throw ValidationError.from({ path: 'name', i18n: { type: 'unique._' } });
  }
}

export function faq() {
  return initServer().router(contract.admin.faq, {
    browse: {
      middleware: [permission('faqs')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions = {
          query,
          columns: ['name'],
          order: [[fn('lower', col('FAQ.name')), 'ASC']],
        };

        if (await aclService.hasPermission('faqs:browse')) {
          const faqs = await FAQ.paginate(paginateOptions);
          return { status: 200, body: faqs };
        }

        const faqs = await FAQ.paginate({
          ...paginateOptions,
          where: { [Op.or]: { ownerId: userId, '$securables.action$': ['read', 'edit', 'delete'] } },
          ...securableScope(userId),
          subQuery: false,
        });

        return { status: 200, body: faqs };
      },
    },
    store: {
      middleware: [permission('faqs', 'faqs:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.name);

        const faq = await FAQ.create({ ...body, ownerId: req.scope.cradle.user.userId });

        return { status: 201, body: faqResponse(faq) };
      },
    },
    read: {
      middleware: [permission('faqs')],
      handler: async ({ params: { faqId }, req }) => {
        const faq = await req.scope.cradle.aclService.findAndCheckRecordAccess(FAQ, 'read', { where: { id: faqId } });

        return { status: 200, body: faqResponse(faq) };
      },
    },
    put: {
      middleware: [permission('faqs')],
      handler: async ({ body, params: { faqId }, req }) => {
        await uniqueMiddleware(body.name, { faqId });

        const faq = await req.scope.cradle.aclService.findAndCheckRecordAccess(FAQ, 'edit', { where: { id: faqId } });

        await faq.update(body);

        return { status: 200, body: faqResponse(faq) };
      },
    },
    destroy: {
      middleware: [permission('faqs')],
      handler: async ({ params: { faqId }, req }) => {
        const faq = await req.scope.cradle.aclService.findAndCheckRecordAccess(FAQ, 'delete', {
          attributes: ['id'],
          where: { id: faqId },
          include: [{ association: 'surveys', attributes: ['id'] }],
        });

        const { id: securableId, surveys } = faq;

        if (!surveys || surveys.length)
          throw new ForbiddenError('FAQ cannot be deleted. There are surveys using this FAQ.');

        await Promise.all([
          UserSecurable.destroy({ where: { securableId, securableType: 'FAQ' } }),
          faq.destroy(),
        ]);

        return { status: 204, body: undefined };
      },
    },
    copy: {
      middleware: [permission('faqs')],
      handler: async ({ body, params: { faqId }, req }) => {
        await uniqueMiddleware(body.name);

        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const faq = await aclService.findAndCheckRecordAccess(FAQ, 'copy', { where: { id: faqId } });

        const { name } = body;
        const { content } = faq;

        const faqCopy = await FAQ.create({ name, content, ownerId: userId });

        return { status: 200, body: faqResponse(faqCopy) };
      },
    },
  });
}
