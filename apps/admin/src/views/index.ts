import type { Dictionary } from '@intake24/common/types';

import authentication from './authentication';
import dashboard from './dashboard.vue';
import faqs from './faqs';
import fdbs from './fdbs';
import feedbackSchemes from './feedback-schemes';
import images from './images';
import jobs from './jobs';
import languages from './languages';
import locales from './locales';
import media from './media';
import nutrientTables from './nutrient-tables';
import nutrientTypes from './nutrient-types';
import nutrientUnits from './nutrient-units';
import permissions from './permissions';
import roles from './roles';
import signInLogs from './sign-in-logs';
import standardUnits from './standard-units';
import surveySchemePrompts from './survey-scheme-prompts';
import surveySchemes from './survey-schemes';
import surveys from './surveys';
import tasks from './tasks';
import user from './user';
import users from './users';

const views: Dictionary = {
  authentication,
  dashboard,
  faqs,
  fdbs,
  'feedback-schemes': feedbackSchemes,
  images,
  jobs,
  languages,
  locales,
  media,
  'nutrient-tables': nutrientTables,
  'nutrient-types': nutrientTypes,
  'nutrient-units': nutrientUnits,
  'sign-in-logs': signInLogs,
  'standard-units': standardUnits,
  'survey-schemes': surveySchemes,
  'survey-scheme-prompts': surveySchemePrompts,
  surveys,
  permissions,
  roles,
  tasks,
  user,
  users,
};

export default views;
