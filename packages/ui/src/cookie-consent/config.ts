import type { CookieConsentConfig } from 'vanilla-cookieconsent';
import type { PluginOptions } from 'vue-gtag';
import { useGtm } from '@gtm-support/vue-gtm';
import Clarity from '@microsoft/clarity';
import { bootstrap, optIn, optOut, setOptions } from 'vue-gtag';

export function gTagConfig(): PluginOptions {
  return {
    appName: import.meta.env.VITE_APP_NAME,
    config: {
      id: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    },
  };
}

async function toggleGA(enabled: boolean) {
  console.debug('GA toggled to ', enabled);
  if (!enabled) {
    console.debug('GA opt-out');
    optOut();
    return;
  }

  console.debug('GA opt-in', enabled);
  optIn();
  setOptions(gTagConfig());
  await bootstrap();
}
async function toggleGTM(enabled: boolean) {
  console.debug('GTM toggled to ', enabled);
  useGtm()?.enable(enabled);
}
async function toggleClarity(enabled: boolean) {
  console.debug('Clarity toggled to ', enabled);
  Clarity.consent(enabled);
}
export function cookieConsentConfig(
  translations: CookieConsentConfig['language']['translations'] = {},
  defaultLang = 'en',
): CookieConsentConfig {
  return ({
    cookie: {
      name: 'it24_cc_consent',
      expiresAfterDays: 365,
    },
    mode: 'opt-out',
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {
        enabled: true,
      },
    },
    language: {
      default: defaultLang,
      translations,
    },
    onChange: ({ cookie }) => {
      console.debug('Consent changed');
      toggleGA(cookie.categories.includes('analytics'));
      toggleGTM(cookie.categories.includes('analytics'));
      toggleClarity(cookie.categories.includes('analytics'));
    },
    onFirstConsent: ({ cookie }) => {
      console.debug('First consent');
      toggleGA(cookie.categories.includes('analytics'));
      toggleGTM(cookie.categories.includes('analytics'));
      toggleClarity(cookie.categories.includes('analytics'));
    },
  });
}
