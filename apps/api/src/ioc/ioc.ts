import type { Config } from '@intake24/api/config';
import type { FoodIndex } from '@intake24/api/food-index';
import type {
  // Admin
  AdminCategoryController,
  AdminFoodController,
  AdminLocalCategoriesController,
  AdminLocalFoodsController,
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
  CachedParentCategoriesService,
  CategoryContentsService,
  CommsProvider,
  CommsService,
  DataExportFields,
  DataExportMapper,
  DataExportService,
  DrinkwareSetService,
  DuoProvider,
  FeedbackService,
  FIDOProvider,
  Filesystem,
  FoodDataService,
  FoodSearchService,
  FoodThumbnailImageService,
  GuideImageService,
  I18nService,
  I18nStore,
  ImageMapService,
  InheritableAttributesService,
  JwtRotationService,
  JwtService,
  LanguageService,
  LocalCategoriesService,
  LocaleService,
  LocalFoodsService,
  MediaService,
  MediaStore,
  NutrientTableService,
  NutrientTypeService,
  NutrientUnitService,
  OTPProvider,
  PopularityCountersService,
  PortionSizeMethodsService,
  PortionSizeService,
  ProcessedImageService,
  Pusher,
  RateLimiter,
  Scheduler,
  Session,
  SignInService,
  SourceImageService,
  Subscriber,
  SurveyService,
  SurveySubmissionService,
  UserService,
} from '@intake24/api/services';
import type { JobsQueueHandler, TasksQueueHandler } from '@intake24/api/services/core/queues';
import type { Logger, Mailer } from '@intake24/common-backend';
import type { TokenPayload } from '@intake24/common/security';
import type { Environment } from '@intake24/common/types';
import type { DatabasesInterface } from '@intake24/db';
import { KyselyDatabases, models } from '@intake24/db';

export interface IoC extends Jobs {
  config: Config;
  aclConfig: Config['acl'];
  appConfig: Config['app'];
  cacheConfig: Config['cache'];
  databaseConfig: Config['database'];
  fsConfig: Config['filesystem'];
  logConfig: Config['log'];
  mailConfig: Config['mail'];
  mediaConfig: Config['media'];
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
  adminLocalFoodsController: AdminLocalFoodsController;
  adminLocalCategoriesController: AdminLocalCategoriesController;

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
  scheduler: Scheduler;
  session: Session;
  subscriber: Subscriber;

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

  adminCategoryService: AdminCategoryService;
  adminFoodService: AdminFoodService;
  localFoodsService: LocalFoodsService;
  localCategoriesService: LocalCategoriesService;
  languageService: LanguageService;
  localeService: LocaleService;
  nutrientTableService: NutrientTableService;
  nutrientTypeService: NutrientTypeService;
  nutrientUnitService: NutrientUnitService;

  feedbackService: FeedbackService;

  // Foods
  foodDataService: FoodDataService;
  foodIndex: FoodIndex;
  portionSizeMethodsService: PortionSizeMethodsService;
  portionSizeService: PortionSizeService;
  foodSearchService: FoodSearchService;
  cachedParentCategoriesService: CachedParentCategoriesService;
  inheritableAttributesService: InheritableAttributesService;

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

  // Media
  mediaService: MediaService;
  mediaStore: MediaStore;

  // Comms
  commsService: CommsService;
  commsProvider: CommsProvider | null;

  // Survey / user
  adminSignupService: AdminSignupService;
  adminSurveyService: AdminSurveyService;
  adminUserService: AdminUserService;

  surveyService: SurveyService;
  surveySubmissionService: SurveySubmissionService;
  popularityCountersService: PopularityCountersService;
  userService: UserService;

  // Dynamic dependency resolver
  resolveDynamic: <T>(name: string) => T;
}

export interface RequestIoC extends IoC {
  user: TokenPayload;
  aclService: ACLService;
  clientLanguages: string[];
}
