/* eslint-disable perfectionist/sort-imports */
import { createApp } from 'vue';
import pinia from '@intake24/ui/stores/bootstrap';
import App from './app.vue';
import i18n from './i18n';
import { loading } from './mixins';
import vuetify from './plugins/vuetify';
import router from './router';
import { errorHandler, mountInterceptors, useHttp } from './services';
import { bootstrapAnalytics, cookieConsentConfig, cookieConsentPlugin } from '@intake24/ui';
import { createManager } from '@vue-youtube/core';
import { useAuth } from './stores';

const app = createApp(App);

app.config.errorHandler = errorHandler;
// app.config.warnHandler = warnHandler;

app.config.globalProperties.$http = useHttp();

// @ts-expect-error vue mixin type issue
app.mixin(loading);

app.use(router);
app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.use(createManager({ deferLoading: { enabled: true, autoLoad: true } }));
app.use(cookieConsentPlugin, cookieConsentConfig());
bootstrapAnalytics(app, router);
app.mount('#app');

mountInterceptors(router, useAuth);
