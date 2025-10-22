import acl from './acl';
import { authentication } from './authentication.contract';
import { faq } from './faq.contract';
import { foodThumbnailImages } from './fdbs/food-thumbnail-images.contract';
import { feedbackScheme } from './feedback-scheme.contract';
import { foodDb } from './food-db.contract';
import images from './images';
import { packageImport } from './io/package-import.contract';
import { job } from './job.contract';
import { languageTranslation } from './language-translation.contract';
import { language } from './language.contract';
import locale from './locale';
import { media } from './media.contract';
import { mediable } from './mediable.contract';
import { nutrientTable } from './nutrient-table.contract';
import { nutrientType } from './nutrient-type.contract';
import { nutrientUnit } from './nutrient-unit.contract';
import { reference } from './reference.contract';
import { securable } from './securable.contract';
import { signInLog } from './sign-in-log.contract';
import { signUp } from './sign-up.contract';
import { standardUnit } from './standard-unit.contract';
import survey from './survey';
import { surveySchemePrompt } from './survey-scheme-prompt.contract';
import { surveyScheme } from './survey-scheme.contract';
import { task } from './task.contract';
import user from './user';

export default {
  acl,
  authentication,
  faq,
  faqMedia: mediable('FAQ', '/admin/faqs/:faqId'),
  faqSecurable: securable('FAQ', '/admin/faqs/:faqId'),
  feedbackScheme,
  feedbackSchemeMedia: mediable('FeedbackScheme', '/admin/feedback-schemes/:feedbackSchemeId'),
  feedbackSchemeSecurable: securable('FeedbackScheme', '/admin/feedback-schemes/:feedbackSchemeId'),
  foodDb,
  foodThumbnailImages,
  images,
  job,
  language,
  languageTranslation,
  languageSecurable: securable('Language', '/admin/languages/:languageId'),
  locale,
  localeSecurable: securable('Locale', '/admin/locales/:localeId'),
  media,
  nutrientTable,
  nutrientType,
  nutrientUnit,
  reference,
  packageImport,
  signInLog,
  signUp,
  standardUnit,
  survey,
  surveySecurable: securable('Survey', '/admin/surveys/:surveyId'),
  surveyScheme,
  surveySchemePrompt,
  surveySchemeMedia: mediable('SurveyScheme', '/admin/survey-schemes/:surveySchemeId'),
  surveySchemeSecurable: securable('SurveyScheme', '/admin/survey-schemes/:surveySchemeId'),
  task,
  user,
};

export type { MediableContract } from './mediable.contract';
export type { SecurableContract } from './securable.contract';
