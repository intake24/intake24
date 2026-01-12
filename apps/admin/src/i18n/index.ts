import type { DefaultLocaleMessageSchema } from 'vue-i18n';

import { merge } from '@intake24/common/util';
import enAdmin from '@intake24/i18n/admin/en';
import enShared from '@intake24/i18n/shared/en';
import { defaultMessages, i18n } from '@intake24/ui';

const messages = merge(enShared, enAdmin) as DefaultLocaleMessageSchema;
i18n.global.setLocaleMessage('en', messages);
defaultMessages.setMessages('en', messages);

export default i18n;
