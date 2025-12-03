/* eslint-disable perfectionist/sort-imports */
import { createApp } from 'vue';
import VueDOMPurifyHTML from 'vue-dompurify-html';
import pinia from '@intake24/ui/stores/bootstrap';
import App from './app.vue';
import i18n from './i18n';
import { auth, loading, module } from './mixins';
import vuetify from './plugins/vuetify';
import router from './router';
import guards from './router/guards';
import { errorHandler, mountInterceptors, useHttp } from './services';
import { useAuth } from './stores';
import { bootstrapAnalytics, cookieConsentConfig, cookieConsentPlugin } from '@intake24/ui/cookie-consent';

guards(router);

const app = createApp(App);

app.config.errorHandler = errorHandler;
// app.config.warnHandler = warnHandler;

app.config.globalProperties.$http = useHttp();

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
app.use(VueDOMPurifyHTML, {
  i18n: {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'p', 'u'],
  },
});
app.use(cookieConsentPlugin, cookieConsentConfig());

bootstrapAnalytics(app, router);

app.mount('#app');

mountInterceptors(router, useAuth);
