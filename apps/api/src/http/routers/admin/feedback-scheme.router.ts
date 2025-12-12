import type { WhereOptions } from 'sequelize';
import path from 'node:path';
import { initServer } from '@ts-rest/express';
import fs from 'fs-extra';
import { pick } from 'lodash';
import { col, fn, Op } from 'sequelize';
import { ForbiddenError, ValidationError } from '@intake24/api/http/errors';
import { permission } from '@intake24/api/http/middleware';
import { feedbackSchemeResponse } from '@intake24/api/http/responses/admin';
import { unique } from '@intake24/api/http/rules';
import { contract } from '@intake24/common/contracts';
import { defaultMeals, defaultTopFoods } from '@intake24/common/feedback';
import { kebabCase } from '@intake24/common/util';
import {
  createFeedbackSchemeFields,
  FeedbackScheme,
  perCardFeedbackSchemeFields,
  PhysicalActivityLevel,
  securableScope,
  SystemNutrientType,
  updateFeedbackSchemeFields,
  UserSecurable,
} from '@intake24/db';
import type { PaginateOptions } from '@intake24/db';

async function uniqueMiddleware(value: any, { feedbackSchemeId }: { feedbackSchemeId?: string } = {}) {
  const where: WhereOptions = feedbackSchemeId ? { id: { [Op.ne]: feedbackSchemeId } } : {};

  if (!(await unique({ model: FeedbackScheme, condition: { field: 'name', value }, options: { where } }))) {
    throw ValidationError.from({ path: 'name', i18n: { type: 'unique._' } });
  }
}

export function feedbackScheme() {
  return initServer().router(contract.admin.feedbackScheme, {
    browse: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions = {
          query,
          columns: ['name'],
          order: [[fn('lower', col('FeedbackScheme.name')), 'ASC']],
        };

        if (await aclService.hasPermission('feedback-schemes:browse')) {
          const feedbackSchemes = await FeedbackScheme.paginate(paginateOptions);
          return { status: 200, body: feedbackSchemes };
        }

        const feedbackSchemes = await FeedbackScheme.paginate({
          ...paginateOptions,
          where: { [Op.or]: { ownerId: userId, '$securables.action$': ['read', 'edit', 'delete'] } },
          ...securableScope(userId),
          subQuery: false,
        });

        return { status: 200, body: feedbackSchemes };
      },
    },
    store: {
      middleware: [permission('feedback-schemes', 'feedback-schemes:create')],
      handler: async ({ body, req }) => {
        await uniqueMiddleware(body.name);

        const {
          meals = defaultMeals,
          topFoods = defaultTopFoods,
          ...rest
        } = body;

        const feedbackScheme = await FeedbackScheme.create({
          ...rest,
          meals,
          topFoods,
          ownerId: req.scope.cradle.user.userId,
        });

        return { status: 201, body: feedbackSchemeResponse(feedbackScheme) };
      },
    },
    refs: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ req }) => {
        const { fsConfig, imagesBaseUrl } = req.scope.cradle;

        const [nutrientTypes, physicalActivityLevels, files] = await Promise.all([
          SystemNutrientType.scope('list').findAll(),
          PhysicalActivityLevel.scope('list').findAll(),
          fs.readdir(path.resolve(fsConfig.local.images, 'feedback')),
        ]);

        const images = files.map((file) => {
          const ext = path.extname(file);
          const name = path.basename(file);

          return {
            id: path.basename(file, ext),
            url: `${imagesBaseUrl}/feedback/${name}`,
          };
        });

        return { status: 200, body: { nutrientTypes, physicalActivityLevels, images } };
      },
    },
    read: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ params: { feedbackSchemeId }, req }) => {
        const feedbackScheme = await req.scope.cradle.aclService.findAndCheckRecordAccess(FeedbackScheme, 'read', {
          where: { id: feedbackSchemeId },
        });

        return { status: 200, body: feedbackSchemeResponse(feedbackScheme) };
      },
    },
    patch: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ body, params: { feedbackSchemeId }, req }) => {
        await uniqueMiddleware(body.name, { feedbackSchemeId });

        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const feedbackScheme = await aclService.findAndCheckRecordAccess(FeedbackScheme, 'edit', {
          where: { id: feedbackSchemeId },
        });

        const keysToUpdate: string[] = [];
        const [resourceActions, securableActions] = await Promise.all([
          aclService.getResourceAccessActions('feedback-schemes'),
          aclService.getSecurableAccessActions(feedbackScheme),
        ]);

        if (resourceActions.includes('edit') || feedbackScheme.ownerId === userId) {
          keysToUpdate.push(...createFeedbackSchemeFields);
        }
        else {
          if (securableActions.includes('edit'))
            keysToUpdate.push(...updateFeedbackSchemeFields);

          perCardFeedbackSchemeFields.forEach((item) => {
            if (securableActions.includes(kebabCase(item)))
              keysToUpdate.push(item);
          });
        }

        const updateInput = pick(body, keysToUpdate);
        if (!Object.keys(updateInput).length)
          throw new ValidationError('Missing body');

        await feedbackScheme.update(updateInput);

        return { status: 200, body: feedbackSchemeResponse(feedbackScheme) };
      },
    },
    put: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ body, params: { feedbackSchemeId }, req }) => {
        await uniqueMiddleware(body.name, { feedbackSchemeId });

        const feedbackScheme = await req.scope.cradle.aclService.findAndCheckRecordAccess(FeedbackScheme, 'edit', {
          where: { id: feedbackSchemeId },
        });

        await feedbackScheme.update(body);

        return { status: 200, body: feedbackSchemeResponse(feedbackScheme) };
      },
    },
    destroy: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ params: { feedbackSchemeId }, req }) => {
        const feedbackScheme = await req.scope.cradle.aclService.findAndCheckRecordAccess(FeedbackScheme, 'delete', {
          attributes: ['id'],
          where: { id: feedbackSchemeId },
          include: [{ association: 'surveys', attributes: ['id'] }],
        });

        const { id: securableId, surveys } = feedbackScheme;

        if (!surveys || surveys.length) {
          throw new ForbiddenError(
            'Feedback scheme cannot be deleted. There are surveys using this feedback scheme.',
          );
        }

        await Promise.all([
          UserSecurable.destroy({ where: { securableId, securableType: 'FeedbackScheme' } }),
          feedbackScheme.destroy(),
        ]);

        return { status: 204, body: undefined };
      },
    },
    copy: {
      middleware: [permission('feedback-schemes')],
      handler: async ({ body, params: { feedbackSchemeId }, req }) => {
        await uniqueMiddleware(body.name);

        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const feedbackScheme = await aclService.findAndCheckRecordAccess(FeedbackScheme, 'copy', {
          where: { id: feedbackSchemeId },
        });

        const { name } = body;
        const {
          type,
          visibility,
          outputs,
          physicalDataFields,
          sections,
          topFoods,
          meals,
          cards,
          demographicGroups,
          henryCoefficients,
        } = feedbackScheme;

        const feedbackSchemeCopy = await FeedbackScheme.create({
          name,
          type,
          visibility,
          outputs,
          physicalDataFields,
          sections,
          topFoods,
          meals,
          cards,
          demographicGroups,
          henryCoefficients,
          ownerId: userId,
        });

        return { status: 200, body: feedbackSchemeResponse(feedbackSchemeCopy) };
      },
    },
  });
}
