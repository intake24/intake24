/* eslint-disable perfectionist/sort-imports */
import { createApp } from 'vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import VueGtag from 'vue-gtag';

import pinia from '@intake24/ui/stores/bootstrap';
import App from './app.vue';
import i18n from './i18n';
import { auth, loading, module } from './mixins';
import vuetify from './plugins/vuetify';
import router from './router';
import guards from './router/guards';
import { errorHandler, httpService } from './services';
import { useAuth } from './stores';
import { cookieConsentConfig, cookieConsentPlugin } from '@intake24/ui/cookie-consent';

import './scss/flags.scss';

guards(router);

const app = createApp(App);

app.config.errorHandler = errorHandler;
// app.config.warnHandler = warnHandler;

app.config.globalProperties.$http = httpService;

// @ts-expect-error vue mixin type issue
app.mixin(auth);
// @ts-expect-error vue mixin type issue
app.mixin(loading);
// @ts-expect-error vue mixin type issue
app.mixin(module);

app.use(router);
app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.use(VueGtag, { bootstrap: false }, router);
app.use(cookieConsentPlugin, cookieConsentConfig());
app.use(VueDOMPurifyHTML, {
  i18n: {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'p', 'u'],
  },
});

app.mount('#app');

app.config.globalProperties.$http.init(router, useAuth);
