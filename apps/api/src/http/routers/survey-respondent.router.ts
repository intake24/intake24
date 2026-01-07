import type { Request } from 'express';
import type { ExtendedFieldValidationError } from '../errors';
import { initServer } from '@ts-rest/express';
import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
import { NotFoundError, ValidationError } from '@intake24/api/http/errors';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import type { SinglePrompt } from '@intake24/common/prompts';
import type { SurveyStatus } from '@intake24/common/surveys';
import { flattenSchemeWithSection, groupSchemeMultiPrompts, isMealSection } from '@intake24/common/surveys';
import { merge } from '@intake24/common/util';
import { Survey } from '@intake24/db';

export function surveyRespondent() {
  const ratingRateLimiter = ioc.cradle.rateLimiter.createMiddleware('rating', {
    message: (req: Request) => req.scope.cradle.i18nService.translate('rateLimit.rating'),
    skipFailedRequests: true,
  });
  const cache = ioc.cradle.cache;
  const surveyService = ioc.cradle.surveyService;
  const surveySettingsCacheTTL = ioc.cradle.config.cache.surveySettingsTTL;

  return initServer().router(contract.surveyRespondent, {
    parameters: async ({ params, req }) => {
      const { slug } = params;
      const { imagesBaseUrl } = req.scope.cradle;

      const survey = await Survey.findBySlug(slug, {
        include: [
          { association: 'surveyScheme', attributes: ['id', 'settings', 'meals', 'prompts'] },
          {
            association: 'feedbackScheme',
            attributes: [
              'id',
              'cards',
              'demographicGroups',
              'henryCoefficients',
              'meals',
              'outputs',
              'physicalDataFields',
              'sections',
              'topFoods',
              'type',
            ],
          },
          { association: 'locale', attributes: ['id', 'code', 'respondentLanguageId'] },
        ],
      });
      if (!survey || !survey.locale || !survey.surveyScheme)
        throw new NotFoundError();

      const {
        id,
        name,
        state: initialState,
        startDate,
        endDate,
        locale,
        surveyScheme,
        feedbackScheme,
        numberOfSubmissionsForFeedback,
        searchSettings: {
          sortingAlgorithm: searchSortingAlgorithm,
          matchScoreWeight: searchMatchScoreWeight,
        },
        session,
        suspensionReason,
        surveyScheme: {
          prompts: surveySchemePrompts,
        },
        surveySchemeOverrides,

      } = survey;

      let state: SurveyStatus;
      const today = new Date();
      if (startDate > today)
        state = 'notStarted';
      else if (endDate < today)
        state = 'completed';
      else state = initialState;

      // Merge survey's scheme overrides
      // Settings - merge
      const settings = { ...surveyScheme.settings, ...surveySchemeOverrides.settings };
      // Meals - override whole list
      const meals = surveySchemeOverrides.meals.length ? surveySchemeOverrides.meals : surveyScheme.meals;

      // Prompts - merge by Prompt ID & Prompt Name
      if (surveySchemeOverrides.prompts.length) {
        const flattenScheme = flattenSchemeWithSection(surveySchemePrompts);
        for (const prompt of surveySchemeOverrides.prompts) {
          const match = flattenScheme.find(
            item => item.id === prompt.id && item.name === prompt.name,
          );
          if (!match)
            continue;

          const { section } = match;

          if (isMealSection(section)) {
            const index = surveySchemePrompts.meals[section].findIndex(
              item => item.id === prompt.id && item.name === prompt.name,
            );
            if (index !== -1)
              surveySchemePrompts.meals[section].splice(index, 1, merge<SinglePrompt>(match, prompt));
          }
          else {
            const index = surveySchemePrompts[section].findIndex(
              item => item.id === prompt.id && item.name === prompt.name,
            );
            if (index !== -1)
              surveySchemePrompts[section].splice(index, 1, merge<SinglePrompt>(match, prompt));
          }
        }
      }

      // Create multi-prompt groups
      const prompts = groupSchemeMultiPrompts(surveySchemePrompts);

      return {
        status: 200,
        body: {
          id,
          slug,
          name,
          state,
          locale,
          surveyScheme: { id: surveyScheme.id, meals, prompts, settings },
          feedbackScheme: feedbackScheme
            ? {
                ...feedbackScheme.get(),
                cards: feedbackScheme.cards.map(card => ({
                  ...card,
                  image: `${imagesBaseUrl}/feedback/${card.image}.jpg`,
                })),
              }
            : undefined,
          numberOfSubmissionsForFeedback,
          session,
          suspensionReason,
          searchSortingAlgorithm,
          searchMatchScoreWeight,
        },
      };
    },
    userInfo: async ({ params: { slug }, query: { tzOffset }, req }) => {
      const { userId } = req.scope.cradle.user;

      const userResponse = await req.scope.cradle.surveyService.userInfo(slug, userId, tzOffset);

      return { status: 200, body: userResponse };
    },
    getSession: async ({ params: { slug }, req }) => {
      const { userId } = req.scope.cradle.user;

      const session = await req.scope.cradle.surveyService.getSession(slug, userId);

      return { status: 200, body: session };
    },
    startSession: async ({ body: { session }, params: { slug }, req }) => {
      const { userId } = req.scope.cradle.user;

      await req.scope.cradle.surveyService.startSession(slug, userId, session);

      return { status: 200, body: undefined };
    },
    saveSession: async ({ body: { session }, params: { slug }, req }) => {
      const { userId } = req.scope.cradle.user;

      await req.scope.cradle.surveyService.saveSession(slug, userId, session);

      return { status: 200, body: undefined };
    },
    clearSession: async ({ params: { slug, sessionId }, req }) => {
      const { userId } = req.scope.cradle.user;

      await req.scope.cradle.surveyService.clearSession(slug, userId, sessionId);

      return { status: 204, body: undefined };
    },
    rating: {
      middleware: [ratingRateLimiter],
      handler: async ({ body, params: { slug }, req }) => {
        const { userId } = req.scope.cradle.user;

        await req.scope.cradle.surveyService.storeRating(slug, userId, body);

        return { status: 200, body: undefined };
      },
    },
    requestHelp: async ({ body, params: { slug: surveySlug }, req }) => {
      const { userId } = req.scope.cradle.user;

      const survey = await Survey.findBySlug(surveySlug, {
        attributes: ['id', 'surveySchemeOverrides'],
        include: [{ association: 'surveyScheme', attributes: ['settings'] }],
      });
      if (!survey?.surveyScheme)
        throw new NotFoundError();

      const settings = { ...survey.surveyScheme.settings, ...survey.surveySchemeOverrides.settings };

      const errors = settings.help.required.reduce<Partial<ExtendedFieldValidationError>[]>((acc, field) => {
        if (field !== 'email|phone' && !body[field]) {
          acc.push({ path: field, i18n: { type: 'string._' } });
          return acc;
        }

        if (!body.email && !body.phone)
          acc.push({ path: 'email', i18n: { type: 'string._', attr: 'email|phone' } });

        return acc;
      }, []);
      if (errors.length)
        throw ValidationError.from(errors);

      await req.scope.cradle.surveyService.requestHelp({ surveySlug, userId, ...body });

      return { status: 200, body: undefined };
    },
    submission: async ({
      headers: { 'user-agent': userAgent },
      body: { submission },
      params: { slug },
      query: { tzOffset },
      req,
    }) => {
      const { userId } = req.scope.cradle.user;

      const followUpInfo = await req.scope.cradle.surveySubmissionService.submit(slug, userId, { ...submission, userAgent }, tzOffset);

      return { status: 200, body: followUpInfo };
    },
    foodSearch: async ({
      params: { slug },
      query,
      req,
    }) => {
      const { searchSettings, localeCode } = await cache.remember(`survey-search-settings:${slug}`, surveySettingsCacheTTL, () => surveyService.getSearchSettings(slug));
      const { description, hidden, category: limitToCategory, previous, recipe } = query;
      const { imagesBaseUrl } = req.scope.cradle;

      const searchOptions: OptionalSearchQueryParameters = {
        previous,
        includeHidden: hidden === 'true',
        limitToCategory,
        limit: searchSettings.maxResults,
        ...searchSettings,
      };

      const searchResults = await req.scope.cradle.foodSearchService.search(localeCode, description, recipe === 'true', searchOptions);

      searchResults.foods = searchResults.foods.map(header => ({ ...header, thumbnailImageUrl: header.thumbnailImageUrl && `${imagesBaseUrl}/${header.thumbnailImageUrl}` }));

      return { status: 200, body: searchResults };
    },
  });
}
