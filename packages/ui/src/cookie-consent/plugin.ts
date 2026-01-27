import type { CookieConsentConfig } from 'vanilla-cookieconsent';
import type { App } from 'vue';

import * as CookieConsent from 'vanilla-cookieconsent';

import 'vanilla-cookieconsent/dist/cookieconsent.css';
import './cookie-consent.css';

export const useCookieConsent = () => CookieConsent;

export const cookieConsentPlugin = {
  install: (app: App, pluginConfig: CookieConsentConfig) => {
    app.config.globalProperties.$cc = CookieConsent;
    app.config.globalProperties.$cc.run(pluginConfig);
  },
};
