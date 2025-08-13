import { createTestingPinia } from '@pinia/testing';
import { config } from '@vue/test-utils';
import { i18n } from '@intake24/i18n';
import vuetify from './plugins/vuetify';

config.global.plugins = [
  i18n,
  createTestingPinia(),
  vuetify,
];
