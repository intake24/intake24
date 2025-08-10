import type { App } from 'vue';
import type { Router } from 'vue-router';
import { createGtm } from '@gtm-support/vue-gtm';
import Clarity from '@microsoft/clarity';
import { configure } from 'vue-gtag';
import { CC_CAT_ANALYTICS } from './config';
import { useCookieConsent } from './plugin';

export function bootstrapAnalytics(app: App, router: Router) {
  const analytics = useCookieConsent().getUserPreferences().acceptedCategories.includes(CC_CAT_ANALYTICS);
  console.debug(`Analytics cookie consent: ${analytics}`);

  if (!analytics)
    return;

  const { VITE_GOOGLE_ANALYTICS_ID, VITE_GTM_CONTAINER_ID, VITE_CLARITY_PROJECT_ID } = import.meta.env;

  // Google Analytics
  if (VITE_GOOGLE_ANALYTICS_ID) {
    configure({
      appName: import.meta.env.VITE_APP_NAME,
      tagId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
      initMode: analytics ? 'auto' : 'manual',
      pageTracker: {
        router,
      },
    });
  }

  // Google Tag Manager
  if (VITE_GTM_CONTAINER_ID) {
    app.use(createGtm({
      id: VITE_GTM_CONTAINER_ID,
      enabled: analytics ?? false,
      debug: import.meta.env.DEV,
      vueRouter: router,
    }));
  }

  // Microsoft Clarity
  if (VITE_CLARITY_PROJECT_ID) {
    Clarity.init(VITE_CLARITY_PROJECT_ID);
  };
}
