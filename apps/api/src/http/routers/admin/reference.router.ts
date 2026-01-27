import type { Pagination } from '@intake24/common/types/http';
import type { PaginateOptions } from '@intake24/db';

import { initServer } from '@ts-rest/express';
import { col, fn, literal, Op } from 'sequelize';

import { anyPermission } from '@intake24/api/http/middleware';
import { imageResponseCollection } from '@intake24/api/http/responses/admin';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import {
  AsServedSet,
  Category,
  DrinkwareSet,
  FAQ,
  FeedbackScheme,
  Food,
  FoodsNutrientType,
  GuideImage,
  ImageMap,
  Language,
  NutrientTable,
  NutrientTableRecord,
  StandardUnit,
  Survey,
  SurveyScheme,
  SystemLocale,
  visibilityScope,
} from '@intake24/db';

export function reference() {
  const responseCollection = imageResponseCollection(ioc.cradle.imagesBaseUrl);

  return initServer().router(contract.admin.reference, {
    asServedSets: {
      middleware: [anyPermission('locales')],
      handler: async ({ query }) => {
        const asServedSets = await AsServedSet.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('AsServedSet.id')), 'ASC']],
          include: ['selectionImage'],
          transform: responseCollection.asServedSetListResponse,
        });

        return { status: 200, body: asServedSets };
      },
    },
    categories: {
      middleware: [anyPermission('locales')],
      handler: async ({ query }) => {
        const { localeId, ...rest } = query;

        const categories: Pagination<{ id: string; code: string; name: string }> = await Category.paginate({
          query: rest,
          where: localeId ? { localeId } : {},
          attributes: localeId ? ['id', 'code', 'name'] : ['code', 'name'],
          columns: ['code', 'name'],
          order: [[fn('lower', col('code')), 'ASC']],
          group: localeId ? undefined : ['code', 'name'],
        });

        return { status: 200, body: categories };
      },
    },
    drinkwareSets: {
      middleware: [anyPermission('locales')],
      handler: async ({ query }) => {
        const drinkwareSets = await DrinkwareSet.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('DrinkwareSet.id')), 'ASC']],
          include: [{ association: 'imageMap', include: [{ association: 'baseImage' }] }],
          transform: responseCollection.drinkwareListResponse,
        });

        return { status: 200, body: drinkwareSets };
      },
    },
    faqs: {
      middleware: [anyPermission('faqs', 'surveys')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions<FeedbackScheme> = {
          query,
          attributes: ['id', 'name'],
          columns: ['id', 'name'],
          order: [[fn('lower', col('FAQ.name')), 'ASC']],
        };

        if (await aclService.hasPermission('faqs:use')) {
          const feedbackSchemes = await FAQ.paginate(paginateOptions);
          return { status: 200, body: feedbackSchemes };
        }

        const faqs = await FAQ.paginate({
          ...paginateOptions,
          ...visibilityScope(userId),
          subQuery: false,
        });

        return { status: 200, body: faqs };
      },
    },
    feedbackSchemes: {
      middleware: [anyPermission('feedback-schemes', 'surveys')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions<FeedbackScheme> = {
          query,
          columns: ['id', 'name'],
          order: [[fn('lower', col('FeedbackScheme.name')), 'ASC']],
        };

        if (await aclService.hasPermission('feedback-schemes:use')) {
          const feedbackSchemes = await FeedbackScheme.paginate(paginateOptions);
          return { status: 200, body: feedbackSchemes };
        }

        const feedbackSchemes = await FeedbackScheme.paginate({
          ...paginateOptions,
          ...visibilityScope(userId),
          subQuery: false,
        });

        return { status: 200, body: feedbackSchemes };
      },
    },
    foods: {
      middleware: [anyPermission('locales')],
      handler: async ({ query }) => {
        const { localeId, ...rest } = query;

        const foods = await Food.paginate({
          query: rest,
          where: { localeId },
          attributes: ['code', 'name'],
          columns: ['code', 'name'],
          order: [[fn('lower', col('code')), 'ASC']],
        });

        return { status: 200, body: foods };
      },
    },
    guideImages: {
      middleware: [anyPermission('locales')],
      handler: async ({ query }) => {
        const guideImages = await GuideImage.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('GuideImage.id')), 'ASC']],
          include: ['selectionImage'],
          transform: responseCollection.guideListResponse,
        });

        return { status: 200, body: guideImages };
      },
    },
    imageMaps: {
      middleware: [anyPermission('locales', 'guide-images')],
      handler: async ({ query }) => {
        const images = await ImageMap.paginate({
          query,
          columns: ['id', 'description'],
          order: [[fn('lower', col('ImageMap.id')), 'ASC']],
          include: ['baseImage'],
          transform: responseCollection.mapListResponse,
        });

        return { status: 200, body: images };
      },
    },
    languages: {
      middleware: [anyPermission('locales', 'feedback-schemes', 'survey-schemes')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions<Language> = {
          query,
          attributes: ['id', 'code', 'englishName', 'localName'],
          columns: ['id', 'code', 'englishName', 'localName'],
          order: [[fn('lower', col('Language.code')), 'ASC']],
        };

        if (await aclService.hasPermission('languages:use')) {
          const languages = await Language.paginate(paginateOptions);
          return { status: 200, body: languages };
        }

        const languages = await Language.paginate({
          ...paginateOptions,
          ...visibilityScope(userId),
          subQuery: false,
        });

        return { status: 200, body: languages };
      },
    },
    locales: {
      middleware: [anyPermission('surveys', 'tasks')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions<SystemLocale> = {
          query,
          attributes: ['id', 'code', 'englishName', 'localName'],
          columns: ['id', 'code', 'englishName', 'localName'],
          order: [[fn('lower', col('Locale.code')), 'ASC']],
        };

        if (await aclService.hasPermission('locales:use')) {
          const locales = await SystemLocale.paginate(paginateOptions);
          return { status: 200, body: locales };
        }

        const locales = await SystemLocale.paginate({
          ...paginateOptions,
          ...visibilityScope(userId),
          subQuery: false,
        });

        return { status: 200, body: locales };
      },
    },
    nutrientTables: {
      middleware: [anyPermission('locales', 'survey-schemes')],
      handler: async ({ query }) => {
        const nutrientTables = await NutrientTable.paginate({
          query,
          attributes: ['id', 'description'],
          columns: ['id', 'description'],
          order: [[fn('lower', col('id')), 'ASC']],
        });

        return { status: 200, body: nutrientTables };
      },
    },
    nutrientTableRecords: {
      middleware: [anyPermission('locales')],
      handler: async ({ params: { nutrientTableId }, query }) => {
        const nutrientTableRecords = await NutrientTableRecord.paginate({
          query,
          columns: ['id', 'name', 'localName', 'nutrientTableRecordId'],
          where: { nutrientTableId },
          order: [[fn('lower', col('NutrientTableRecord.name')), 'ASC']],
        });

        return { status: 200, body: nutrientTableRecords };
      },
    },
    nutrientTypes: {
      middleware: [anyPermission('feedback-schemes', 'survey-schemes')],
      handler: async ({ query }) => {
        const { nutrientTableId } = query;

        if (nutrientTableId) {
          const nutrientTypes = await FoodsNutrientType.paginate({
            query,
            attributes: ['id', 'description', 'unitId'],
            columns: ['id', 'description'],
            where: {
              id: {
                [Op.in]: literal(`(
                  SELECT DISTINCT nutrient_type_id
                  FROM nutrient_table_record_nutrients ntrn
                  JOIN nutrient_table_records ntr ON ntr.id = ntrn.nutrient_table_record_id
                  WHERE ntr.nutrient_table_id = '${nutrientTableId}')`),
              },
            },
            order: [['id', 'ASC']],
          });

          return { status: 200, body: nutrientTypes };
        }

        const nutrientTypes = await FoodsNutrientType.paginate({
          query,
          attributes: ['id', 'description', 'unitId'],
          columns: ['id', 'description'],
          order: [['id', 'ASC']],
        });

        return { status: 200, body: nutrientTypes };
      },
    },
    standardUnits: {
      middleware: [anyPermission('locales', 'survey-schemes')],
      handler: async ({ query }) => {
        const standardUnits = await StandardUnit.paginate({
          query,
          attributes: ['id', 'name', 'estimateIn', 'howMany'],
          columns: ['id', 'name'],
          order: [[fn('lower', col('id')), 'ASC']],
        });

        return { status: 200, body: standardUnits };
      },
    },
    surveys: {
      middleware: [anyPermission('tasks')],
      handler: async ({ query }) => {
        const surveys = await Survey.paginate({
          query,
          attributes: ['id', 'slug', 'name'],
          columns: ['id', 'name'],
          order: [[fn('lower', col('name')), 'ASC']],
        });

        return { status: 200, body: surveys };
      },
    },
    surveySchemes: {
      middleware: [anyPermission('survey-schemes', 'surveys')],
      handler: async ({ query, req }) => {
        const {
          aclService,
          user: { userId },
        } = req.scope.cradle;

        const paginateOptions: PaginateOptions<SurveyScheme> = {
          query,
          columns: ['id', 'name'],
          order: [[fn('lower', col('SurveyScheme.name')), 'ASC']],
        };

        if (await aclService.hasPermission('survey-schemes:use')) {
          const surveySchemes = await SurveyScheme.paginate(paginateOptions);
          return { status: 200, body: surveySchemes };
        }

        const surveySchemes = await SurveyScheme.paginate({
          ...paginateOptions,
          ...visibilityScope(userId),
          subQuery: false,
        });

        return { status: 200, body: surveySchemes };
      },
    },
  });
}
