import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { Router } from 'express';
import passport from 'passport';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';
import { FAQ, FeedbackScheme, Language, Survey, SurveyScheme, SystemLocale } from '@intake24/db';
import { requestValidationErrorHandler } from '../errors';
import { isAalSatisfied, isAccountVerified, isSurveyRespondent, registerACLScope } from '../middleware';
import admin from './admin';
import { authentication } from './authentication.router';
import { category } from './category.router';
import { feedback } from './feedback.router';
import { food } from './food.router';
import { health } from './health.router';
import { i18n } from './i18n.router';
import { password } from './password.router';
import { portionSize } from './portion-size.router';
import { subscription } from './subscription.router';
import { surveyRespondent } from './survey-respondent.router';
import { survey } from './survey.router';
import user from './user';

const server = initServer();

export function registerRouters(express: Router) {
  const responseValidation = false;
  // Public endpoints
  createExpressEndpoints(
    contract.public,
    server.router(contract.public, {
      authentication: authentication(),
      health: health(),
      i18n: i18n(),
      password: password(),
      survey: survey(),
    }),
    express,
    { responseValidation, requestValidationErrorHandler },
  );
  // Authenticated endpoints
  const authContract = {
    category: contract.category,
    feedback: contract.feedback,
    food: contract.food,
    portionSize: contract.portionSize,
    subscription: contract.subscription,
    user: contract.user,
  };
  createExpressEndpoints(
    authContract,
    server.router(authContract, {
      category: category(),
      feedback: feedback(),
      food: food(),
      portionSize: portionSize(),
      subscription: subscription(),
      user: {
        profile: user.profile(),
        feedback: user.feedback(),
      },
    }),
    express,
    {
      responseValidation,
      requestValidationErrorHandler,
      globalMiddleware: [passport.authenticate('survey', { session: false }), registerACLScope],
    },
  );
  // Survey respondent endpoints
  createExpressEndpoints(
    contract.surveyRespondent,
    server.router(contract.surveyRespondent, surveyRespondent()),
    express,
    {
      responseValidation,
      // @ts-expect-error fix types (caused by 204/undefined)
      requestValidationErrorHandler,
      globalMiddleware: [
        passport.authenticate('survey', { session: false }),
        registerACLScope,
        isSurveyRespondent(),
      ],
    },
  );

  // Admin endpoints - public
  const adminPublicContract = {
    authentication: contract.admin.authentication,
    signUp: contract.admin.signUp,
  };

  createExpressEndpoints(
    adminPublicContract,
    server.router(adminPublicContract, {
      authentication: admin.authentication(),
      signUp: admin.signUp(),
    }),
    express,
    { responseValidation, requestValidationErrorHandler },
  );

  // Admin endpoints - authenticated
  const adminAuthContract = {
    profile: contract.admin.user.profile,
  };

  createExpressEndpoints(
    adminAuthContract,
    server.router(adminAuthContract, {
      profile: admin.user.profile(),
    }),
    express,
    {
      responseValidation,
      requestValidationErrorHandler,
      globalMiddleware: [
        passport.authenticate('admin', { session: false }),
        registerACLScope,
      ],
    },
  );

  // Admin endpoints - authenticated & verified
  const adminAuthVerifiedContract = {
    device: contract.admin.user.mfa.device,
    duo: contract.admin.user.mfa.duo,
    fido: contract.admin.user.mfa.fido,
    otp: contract.admin.user.mfa.otp,
  };

  createExpressEndpoints(
    adminAuthVerifiedContract,
    server.router(adminAuthVerifiedContract, {
      device: admin.user.mfa.device(),
      duo: admin.user.mfa.duo(),
      fido: admin.user.mfa.fido(),
      otp: admin.user.mfa.otp(),
    }),
    express,
    {
      responseValidation,
      // @ts-expect-error fix types (caused by 204/undefined)
      requestValidationErrorHandler,
      globalMiddleware: [
        passport.authenticate('admin', { session: false }),
        registerACLScope,
        isAccountVerified,
      ],
    },
  );

  // Admin endpoints - authenticated & verified & MFA satisfied
  const adminAuthVerifiedMfaContract = {
    asServedImage: contract.admin.images.asServedImage,
    asServedSet: contract.admin.images.asServedSet,
    drinkwareSet: contract.admin.images.drinkwareSet,
    faq: contract.admin.faq,
    faqMedia: contract.admin.faqMedia,
    faqSecurable: contract.admin.faqSecurable,
    feedbackScheme: contract.admin.feedbackScheme,
    feedbackSchemeMedia: contract.admin.feedbackSchemeMedia,
    feedbackSchemeSecurable: contract.admin.feedbackSchemeSecurable,
    foodDb: contract.admin.foodDb,
    foodThumbnailImages: contract.admin.foodThumbnailImages,
    guideImage: contract.admin.images.guideImage,
    imageMap: contract.admin.images.imageMap,
    job: contract.admin.job,
    language: contract.admin.language,
    languageSecurable: contract.admin.languageSecurable,
    languageTranslation: contract.admin.languageTranslation,
    locale: contract.admin.locale.locale,
    localeRecipeFood: contract.admin.locale.recipeFood,
    localeSplitList: contract.admin.locale.splitList,
    localeSplitWord: contract.admin.locale.splitWord,
    localeSynonymSet: contract.admin.locale.synonymSet,
    localeSecurable: contract.admin.localeSecurable,
    media: contract.admin.media,
    nutrientTable: contract.admin.nutrientTable,
    nutrientType: contract.admin.nutrientType,
    nutrientUnit: contract.admin.nutrientUnit,
    packageImport: contract.admin.packageImport,
    reference: contract.admin.reference,
    signInLog: contract.admin.signInLog,
    standardUnit: contract.admin.standardUnit,
    surveyScheme: contract.admin.surveyScheme,
    surveySchemeMedia: contract.admin.surveySchemeMedia,
    surveySchemePrompt: contract.admin.surveySchemePrompt,
    surveySchemeSecurable: contract.admin.surveySchemeSecurable,
    survey: contract.admin.survey.survey,
    surveyRespondent: contract.admin.survey.respondent,
    surveyRespondentCustomField: contract.admin.survey.respondentCustomField,
    surveySecurable: contract.admin.surveySecurable,
    surveySession: contract.admin.survey.session,
    surveySubmission: contract.admin.survey.submission,
    task: contract.admin.task,
    permission: contract.admin.acl.permission,
    role: contract.admin.acl.role,
    user: contract.admin.acl.user,
    personalAccessToken: contract.admin.user.personalAccessToken,
    userJob: contract.admin.user.job,
  };

  const adminAuthVerifiedMfaMiddleware = [
    passport.authenticate('admin', { session: false }),
    registerACLScope,
    isAccountVerified,
    isAalSatisfied,
  ];

  createExpressEndpoints(
    adminAuthVerifiedMfaContract,
    server.router(adminAuthVerifiedMfaContract, {
      asServedImage: admin.images.asServedImage(),
      asServedSet: admin.images.asServedSet(),
      drinkwareSet: admin.images.drinkwareSet(),
      faq: admin.faq(),
      faqMedia: admin.mediable(FAQ, contract.admin.faqMedia),
      faqSecurable: admin.securable(FAQ, contract.admin.faqSecurable),
      feedbackScheme: admin.feedbackScheme(),
      feedbackSchemeMedia: admin.mediable(FeedbackScheme, contract.admin.feedbackSchemeMedia),
      feedbackSchemeSecurable: admin.securable(FeedbackScheme, contract.admin.feedbackSchemeSecurable),
      foodDb: admin.foodDb(),
      foodThumbnailImages: admin.foodThumbnailImages(),
      guideImage: admin.images.guideImage(),
      imageMap: admin.images.imageMap(),
      job: admin.job(),
      language: admin.language(),
      languageTranslation: admin.languageTranslation(),
      languageSecurable: admin.securable(Language, contract.admin.languageSecurable),
      locale: admin.locale.locale(),
      localeRecipeFood: admin.locale.recipeFood(),
      localeSplitList: admin.locale.splitList(),
      localeSplitWord: admin.locale.splitWord(),
      localeSynonymSet: admin.locale.synonymSet(),
      localeSecurable: admin.securable(SystemLocale, contract.admin.localeSecurable),
      media: admin.media(),
      nutrientTable: admin.nutrientTable(),
      nutrientType: admin.nutrientType(),
      nutrientUnit: admin.nutrientUnit(),
      packageImport: admin.packageImport(),
      reference: admin.reference(),
      signInLog: admin.signInLog(),
      standardUnit: admin.standardUnit(),
      survey: admin.survey.survey(),
      surveyRespondent: admin.survey.respondent(),
      surveyRespondentCustomField: admin.survey.respondentCustomField(),
      surveySecurable: admin.securable(Survey, contract.admin.surveySecurable),
      surveySession: admin.survey.session(),
      surveySubmission: admin.survey.submission(),
      surveyScheme: admin.surveyScheme(),
      surveySchemeMedia: admin.mediable(SurveyScheme, contract.admin.surveySchemeMedia),
      surveySchemePrompt: admin.surveySchemePrompt(),
      surveySchemeSecurable: admin.securable(SurveyScheme, contract.admin.surveySchemeSecurable),
      task: admin.task(),
      permission: admin.acl.permission(),
      role: admin.acl.role(),
      user: admin.acl.user(),
      personalAccessToken: admin.user.personalAccessToken(),
      userJob: admin.user.job(),
    }),
    express,
    {
      responseValidation,
      // @ts-expect-error fix types (caused by 204/undefined)
      requestValidationErrorHandler,
      globalMiddleware: adminAuthVerifiedMfaMiddleware,
    },
  );

  // Tus protocol server has a protocol that is clunky to wrap in a ts-rest contract definition
  // for example, OPTIONS

  const tusServer = ioc.cradle.tusServer;
  const tusRouter = Router();
  tusRouter.use(adminAuthVerifiedMfaMiddleware);

  // Workaround for a middleware conflict between Tus server and express-session 🤡🤡🤡
  //
  // The error occurs because srvx (used by @tus/server) calls res.end() with a callback function
  // as the first argument (e.g., res.end(() => {...})) during Tus PATCH requests. express-session
  // overrides res.end() to handle async session saving, misinterpreting the callback as the "chunk" argument,
  // which must be a string, Buffer, or Uint8Array, causing a crash.

  tusRouter.use((req, res, next) => {
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any, callback?: () => void) {
      if (typeof chunk === 'function') {
      // Fix: Convert res.end(callback) to res.end(null, callback)
        callback = chunk;
        chunk = null;
      }
      return originalEnd.call(this, chunk, encoding, callback);
    };
    next();
  });

  tusRouter.all('*', (req, res) => {
    console.log(`>>>> Tus request: ${req.path}`);
    tusServer.handle(req, res);
  });

  express.use('/admin/large-file-upload', tusRouter);
}
