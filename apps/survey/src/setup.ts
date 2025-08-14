import { createTestingPinia } from '@pinia/testing';
import { config } from '@vue/test-utils';
import i18n from './i18n';
import vuetify from './plugins/vuetify';

config.global.plugins = [
  createTestingPinia(),
  i18n,
  vuetify,
];
