import type { AwilixContainer } from 'awilix';
import type { RequestIoC } from './ioc';
import { asClass, asFunction, asValue } from 'awilix';
import foodIndex from '@intake24/api/food-index';
import {
  aclCache,
  aclService,
  adminCategoryService,
  adminFoodService,
  adminSignupService,
  adminSurveyService,
  adminUserService,
  asServedService,
  authenticationService,
  Cache,
  cachedParentCategoriesService,
  categoryContentsService,
  commsProviders,
  commsService,
  dataExportFields,
  dataExportMapper,
  dataExportService,
  drinkwareSetService,
  duoProvider,
  feedbackService,
  fidoProvider,
  Filesystem,
  foodDataService,
  foodSearchService,
  foodThumbnailImageService,
  guideImageService,
  i18nService,
  i18nStore,
  imageMapService,
  inheritableAttributesService,
  jwtRotationService,
  jwtService,
  languageService,
  localCategoriesService,
  localeService,
  localFoodsService,
  mediaService,
  mediaStores,
  nutrientTableService,
  nutrientTypeService,
  nutrientUnitService,
  otpProvider,
  PopularityCountersService,
  portionSizeMethodsService,
  portionSizeService,
  processedImageService,
  Pusher,
  RateLimiter,
  Scheduler,
  Session,
  signInService,
  sourceImageService,
  surveyService,
  surveySubmissionService,
  userService,
} from '@intake24/api/services';
import { JobsQueueHandler, TasksQueueHandler } from '@intake24/api/services/core/queues';
import { logger, Mailer } from '@intake24/common-backend';

export default (container: AwilixContainer<RequestIoC>): void => {
  const mediaStore = container.cradle.mediaConfig.storage.provider;
  const commsProvider = container.cradle.servicesConfig.comms.provider;

  container.register({
    authenticationService: asFunction(authenticationService).singleton(),
    aclCache: asFunction(aclCache).singleton(),
    aclService: asFunction(aclService).scoped(),

    duoProvider: asFunction(duoProvider).singleton(),
    fidoProvider: asFunction(fidoProvider).singleton(),
    otpProvider: asFunction(otpProvider).singleton(),

    jwtService: asFunction(jwtService).singleton(),
    jwtRotationService: asFunction(jwtRotationService).singleton(),
    signInService: asFunction(signInService).singleton(),

    asServedService: asFunction(asServedService).singleton(),
    drinkwareSetService: asFunction(drinkwareSetService).singleton(),
    guideImageService: asFunction(guideImageService).singleton(),
    imageMapService: asFunction(imageMapService).singleton(),
    processedImageService: asFunction(processedImageService).singleton(),
    sourceImageService: asFunction(sourceImageService).singleton(),
    foodThumbnailImageService: asFunction(foodThumbnailImageService).singleton(),

    feedbackService: asFunction(feedbackService).singleton(),
    foodDataService: asFunction(foodDataService).singleton(),
    foodSearchService: asFunction(foodSearchService).singleton(),
    foodIndex: asValue(foodIndex),
    portionSizeMethodsService: asFunction(portionSizeMethodsService).singleton(),
    portionSizeService: asFunction(portionSizeService).singleton(),
    categoryContentsService: asFunction(categoryContentsService).singleton(),
    cachedParentCategoriesService: asFunction(cachedParentCategoriesService).singleton(),
    inheritableAttributesService: asFunction(inheritableAttributesService).singleton(),

    adminCategoryService: asFunction(adminCategoryService).singleton(),
    adminFoodService: asFunction(adminFoodService).singleton(),
    localFoodsService: asFunction(localFoodsService).singleton(),
    localCategoriesService: asFunction(localCategoriesService).singleton(),

    languageService: asFunction(languageService).singleton(),
    localeService: asFunction(localeService).singleton(),
    nutrientTableService: asFunction(nutrientTableService).singleton(),
    nutrientTypeService: asFunction(nutrientTypeService).singleton(),
    nutrientUnitService: asFunction(nutrientUnitService).singleton(),

    dataExportFields: asFunction(dataExportFields).singleton(),
    dataExportMapper: asFunction(dataExportMapper).singleton(),
    dataExportService: asFunction(dataExportService).singleton(),

    mediaService: asFunction(mediaService).singleton(),
    mediaStore: asFunction(mediaStores[mediaStore]).singleton(),

    adminSignupService: asFunction(adminSignupService).singleton(),
    adminSurveyService: asFunction(adminSurveyService).singleton(),
    adminUserService: asFunction(adminUserService).singleton(),

    surveyService: asFunction(surveyService).singleton(),
    surveySubmissionService: asFunction(surveySubmissionService).singleton(),
    popularityCountersService: asClass(PopularityCountersService).singleton(),
    userService: asFunction(userService).singleton(),

    commsService: asFunction(commsService).singleton(),
    commsProvider: commsProvider ? asFunction(commsProviders[commsProvider]).singleton() : asValue(null),

    cache: asClass(Cache).singleton(),
    filesystem: asClass(Filesystem).singleton(),
    i18nService: asFunction(i18nService).scoped(),
    i18nStore: asFunction(i18nStore).singleton(),
    logger: asValue(logger),
    mailer: asClass(Mailer).singleton(),
    pusher: asClass(Pusher).singleton(),
    rateLimiter: asClass(RateLimiter).singleton(),
    scheduler: asClass(Scheduler).singleton(),
    session: asClass(Session).singleton(),

    jobsQueueHandler: asClass(JobsQueueHandler).singleton(),
    tasksQueueHandler: asClass(TasksQueueHandler).singleton(),
  });
};
