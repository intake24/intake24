import { asClass, asValue, createContainer } from 'awilix';

import type { Config } from '@intake24/api/config';
import config from '@intake24/api/config';
import type { FoodIndex } from '@intake24/api/food-index';
import type {
  // Admin
  AdminCategoryController,
  AdminFoodController,
  AdminGlobalCategoriesController,
  AdminGlobalFoodsController,
  AdminLocalCategoriesController,
  AdminLocalFoodsController,
  CodeLookupController,
  DrinkScaleController,
} from '@intake24/api/http/controllers';
import type { Jobs } from '@intake24/api/jobs';
import type {
  ACLCache,
  ACLService,
  AdminCategoryService,
  AdminFoodService,
  AdminSignupService,
  AdminSurveyService,
  AdminUserService,
  AsServedService,
  AuthenticationService,
  Cache,
  CategoryContentsService,
  DataExportFields,
  DataExportMapper,
  DataExportService,
  DrinkwareSetService,
  DuoProvider,
  EmbeddingLoaderService,
  FeedbackService,
  FIDOProvider,
  Filesystem,
  FoodDataService,
  FoodSearchService,
  FoodThumbnailImageService,
  GlobalCategoriesService,
  GlobalFoodsService,
  GuideImageService,
  HybridScorerService,
  I18nService,
  I18nStore,
  ImageMapService,
  JwtRotationService,
  JwtService,
  LanguageService,
  LocalCategoriesService,
  LocaleService,
  LocalFoodsService,
  NutrientTableService,
  NutrientTypeService,
  NutrientUnitService,
  OpenAIEmbeddingService,
  OTPProvider,
  PopularityCountersService,
  PortionSizeMethodsService,
  PortionSizeService,
  ProcessedImageService,
  Publisher,
  Pusher,
  RateLimiter,
  Scheduler,
  SemanticSearchService,
  Session,
  SignInService,
  SourceImageService,
  Subscriber,
  SurveyService,
  SurveySubmissionService,
  UserService,
} from '@intake24/api/services';
import type { JobsQueueHandler, TasksQueueHandler } from '@intake24/api/services/core/queues';
import type { CachedParentCategoriesService } from '@intake24/api/services/foods/cached-parent-categories-service';
import type { FoodOrCategoryLookupService } from '@intake24/api/services/foods/food-or-category-lookup.service';
import type { InheritableAttributesService } from '@intake24/api/services/foods/inheritable-attributes-service';
import type { Logger, Mailer } from '@intake24/common-backend';
import type { TokenPayload } from '@intake24/common/security';
import type { Environment } from '@intake24/common/types';
import type { DatabasesInterface } from '@intake24/db';
import { Database, KyselyDatabases, models } from '@intake24/db';

import controllers from './controllers';
import jobs from './jobs';
import services from './services';

export interface IoC extends Jobs {
  config: Config;
  aclConfig: Config['acl'];
  appConfig: Config['app'];
  cacheConfig: Config['cache'];
  databaseConfig: Config['database'];
  fsConfig: Config['filesystem'];
  logConfig: Config['log'];
  mailConfig: Config['mail'];
  pdfConfig: Config['pdf'];
  queueConfig: Config['queue'];
  rateLimiterConfig: Config['rateLimiter'];
  publisherConfig: Config['publisher'];
  subscriberConfig: Config['subscriber'];
  securityConfig: Config['security'];
  servicesConfig: Config['services'];
  sessionConfig: Config['session'];
  imageProcessorConfig: Config['imageProcessor'];
  // Expose some config settings directly to avoid pulling in the whole config when it doesn't
  // make sense, e.g. for testing
  environment: Environment;
  imagesBaseUrl: string;

  // Authenticated / scoped user vars
  // user: TokenPayload;

  // Admin controllers
  adminCategoryController: AdminCategoryController;
  adminFoodController: AdminFoodController;
  adminGlobalFoodsController: AdminGlobalFoodsController;
  adminLocalFoodsController: AdminLocalFoodsController;
  adminGlobalCategoriesController: AdminGlobalCategoriesController;
  adminLocalCategoriesController: AdminLocalCategoriesController;
  codeLookupController: CodeLookupController;

  // Images
  drinkScaleController: DrinkScaleController;

  // System services
  db: DatabasesInterface;
  kyselyDb: KyselyDatabases;
  models: typeof models;
  cache: Cache;
  filesystem: Filesystem;
  i18nService: I18nService;
  i18nStore: I18nStore;
  logger: Logger;
  mailer: Mailer;
  pusher: Pusher;
  rateLimiter: RateLimiter;
  reindexingSubscriberService: Subscriber;
  reindexingPublisherService: Publisher;
  scheduler: Scheduler;
  session: Session;

  // Queues
  jobsQueueHandler: JobsQueueHandler;
  tasksQueueHandler: TasksQueueHandler;

  // Authentication
  aclCache: ACLCache;
  authenticationService: AuthenticationService;
  jwtService: JwtService;
  jwtRotationService: JwtRotationService;
  signInService: SignInService;

  // MFA Providers
  otpProvider: OTPProvider;
  fidoProvider: FIDOProvider;
  duoProvider: DuoProvider;

  // Data export
  dataExportFields: DataExportFields;
  dataExportMapper: DataExportMapper;
  dataExportService: DataExportService;

  // AI services
  openAIEmbeddingService: OpenAIEmbeddingService;
  embeddingLoaderService: EmbeddingLoaderService;
  hybridScorerService: HybridScorerService;
  semanticSearchService: SemanticSearchService;
  embeddingConfig: Config['services']['embedding'];

  adminCategoryService: AdminCategoryService;
  adminFoodService: AdminFoodService;
  localFoodsService: LocalFoodsService;
  globalFoodsService: GlobalFoodsService;
  localCategoriesService: LocalCategoriesService;
  globalCategoriesService: GlobalCategoriesService;
  languageService: LanguageService;
  localeService: LocaleService;
  nutrientTableService: NutrientTableService;
  nutrientTypeService: NutrientTypeService;
  nutrientUnitService: NutrientUnitService;

  feedbackService: FeedbackService;

  // Foods
  foodDataService: FoodDataService;
  foodOrCategoryLookupService: FoodOrCategoryLookupService;
  foodIndex: FoodIndex;
  portionSizeMethodsService: PortionSizeMethodsService;
  portionSizeService: PortionSizeService;
  inheritableAttributesService: InheritableAttributesService;
  foodSearchService: FoodSearchService;
  cachedParentCategoriesService: CachedParentCategoriesService;

  // Categories
  categoryContentsService: CategoryContentsService;

  // Images
  processedImageService: ProcessedImageService;
  sourceImageService: SourceImageService;
  asServedService: AsServedService;
  drinkwareSetService: DrinkwareSetService;
  guideImageService: GuideImageService;
  imageMapService: ImageMapService;
  foodThumbnailImageService: FoodThumbnailImageService;

  // Survey / user
  adminSignupService: AdminSignupService;
  adminSurveyService: AdminSurveyService;
  adminUserService: AdminUserService;

  surveyService: SurveyService;
  surveySubmissionService: SurveySubmissionService;
  popularityCountersService: PopularityCountersService;
  userService: UserService;
}

export interface RequestIoC extends IoC {
  user: TokenPayload;
  aclService: ACLService;
  clientLanguages: string[];
}

function configureContainer() {
  const container = createContainer<IoC>({ strict: true });

  container.register({
    config: asValue(config),
    aclConfig: asValue(config.acl),
    appConfig: asValue(config.app),
    cacheConfig: asValue(config.cache),
    databaseConfig: asValue(config.database),
    fsConfig: asValue(config.filesystem),
    logConfig: asValue(config.log),
    mailConfig: asValue(config.mail),
    pdfConfig: asValue(config.pdf),
    queueConfig: asValue(config.queue),
    rateLimiterConfig: asValue(config.rateLimiter),
    securityConfig: asValue(config.security),
    servicesConfig: asValue(config.services),
    sessionConfig: asValue(config.session),
    publisherConfig: asValue(config.publisher),
    subscriberConfig: asValue(config.subscriber),
    embeddingConfig: asValue(config.services.embedding),
    environment: asValue(config.app.env),
    imagesBaseUrl: asValue(config.app.urls.images),
    imageProcessorConfig: asValue(config.imageProcessor),
    db: asClass(Database).singleton(),
    kyselyDb: asClass(KyselyDatabases).singleton(),
    models: asValue(models),
  });

  controllers(container);
  services(container);
  jobs(container);

  return container;
}

export default configureContainer();
