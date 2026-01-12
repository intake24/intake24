import type { DefaultLocaleMessageSchema } from 'vue-i18n';

import { merge } from '@intake24/common/util';
import enShared from '@intake24/i18n/shared/en';
import enSurvey from '@intake24/i18n/survey/en';
import { defaultMessages, i18n } from '@intake24/ui';

const messages = merge(enShared, enSurvey) as DefaultLocaleMessageSchema;
i18n.global.setLocaleMessage('en', messages);
defaultMessages.setMessages('en', messages);

export default i18n;
