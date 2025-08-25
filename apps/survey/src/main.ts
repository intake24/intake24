/* eslint-disable perfectionist/sort-imports */
import { createApp } from 'vue';
import VueGtag from 'vue-gtag';

import pinia from '@intake24/ui/stores/bootstrap';
import App from './app.vue';
import i18n from './i18n';
import { loading } from './mixins';
import vuetify from './plugins/vuetify';
import router from './router';
import { errorHandler, httpService } from './services';
import { cookieConsentConfig, cookieConsentPlugin } from '@intake24/ui';
import * as CookieConsent from 'vanilla-cookieconsent';
import { createManager } from '@vue-youtube/core';
import { createGtm } from '@gtm-support/vue-gtm';
import Clarity from '@microsoft/clarity';

import './scss/flags.scss';

import { useAuth } from './stores';

const app = createApp(App);

app.config.errorHandler = errorHandler;
// app.config.warnHandler = warnHandler;

app.config.globalProperties.$http = httpService;

// @ts-expect-error vue mixin type issue
app.mixin(loading);

app.use(router);
app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.use(VueGtag, { bootstrap: false }, router);
app.use(cookieConsentPlugin, cookieConsentConfig());
app.use(createManager({ deferLoading: { enabled: true, autoLoad: true } }));
const containerId = import.meta.env.VITE_GTM_CONTAINER_ID;
if (containerId) {
  app.use(createGtm({ id: containerId, enabled: CookieConsent.acceptedCategory('analytics') ?? false, debug: import.meta.env.DEV, vueRouter: router }));
}
console.debug(`Analytic cookie consent:${CookieConsent.acceptedCategory('analytics')}`);
const id = import.meta.env.VITE_CLARITY_PROJECT_ID;
if (id) {
  Clarity.init(id);
};
app.mount('#app');

app.config.globalProperties.$http.init(router, useAuth);
