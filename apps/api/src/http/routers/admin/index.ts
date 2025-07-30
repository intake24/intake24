import acl from './acl';
import { authentication } from './authentication.router';
import { faq } from './faq.router';
import { feedbackScheme } from './feedback-scheme.router';
import { foodDb } from './food-db.router';
import { foodGroup } from './food-group.router';
import { foodThumbnailImages } from './food-thumbnail-images.router';
import images from './images';
import { job } from './job.router';
import { languageTranslation } from './language-translation.router';
import { language } from './language.router';
import locale from './locale';
import { nutrientTable } from './nutrient-table.router';
import { nutrientType } from './nutrient-type.router';
import { nutrientUnit } from './nutrient-unit.router';
import { reference } from './reference.router';
import { securable } from './securable.router';
import { signInLog } from './sign-in-log.router';
import { signUp } from './sign-up.router';
import { standardUnit } from './standard-unit.router';
import survey from './survey';
import { surveySchemePrompt } from './survey-scheme-prompt.router';
import { surveyScheme } from './survey-scheme.router';
import { task } from './task.router';
import user from './user';

export default {
  acl,
  authentication,
  faq,
  feedbackScheme,
  foodDb,
  foodThumbnailImages,
  foodGroup,
  images,
  job,
  language,
  languageTranslation,
  locale,
  nutrientTable,
  nutrientType,
  nutrientUnit,
  reference,
  securable,
  signInLog,
  signUp,
  standardUnit,
  survey,
  surveyScheme,
  surveySchemePrompt,
  task,
  user,
};
