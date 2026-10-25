import { initContract } from '@ts-rest/core';

import admin from './admin';
import { authentication } from './authentication.contract';
import { feedback } from './feedback.contract';
import { health } from './health.contract';
import { i18n } from './i18n.contract';
import locale from './locale';
import { password } from './password.contract';
import { portionSize } from './portion-size.contract';
import { subscription } from './subscription.contract';
import { surveyRespondent } from './survey-respondent.contract';
import { survey } from './survey.contract';
import user from './user';

const c = initContract();

export const contract = c.router({
  public: {
    authentication,
    health,
    i18n,
    password,
    survey,
  },
  feedback,
  locale,
  subscription,
  user,
  portionSize,
  surveyRespondent,
  admin,
});

export default contract;
