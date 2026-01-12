import type { CookieConsentConfig, Translation } from 'vanilla-cookieconsent';
import { useGtm } from '@gtm-support/vue-gtm';
import Clarity from '@microsoft/clarity';
import { get } from 'lodash-es';
import { useConsent } from 'vue-gtag';
import { defaultMessages } from '../i18n';

export const CC_CAT_NECESSARY = 'necessary';
export const CC_CAT_FUNCTIONALITY = 'functionality';
export const CC_CAT_ANALYTICS = 'analytics';

export async function toggleGA(enabled: boolean) {
  console.debug('GA toggled to ', enabled);

  const { acceptAll, rejectAll } = useConsent();

  if (!enabled) {
    console.debug('GA opt-out');
    rejectAll();
    return;
  }

  console.debug('GA opt-in', enabled);
  acceptAll();
}

export async function toggleGTM(enabled: boolean) {
  console.debug('GTM toggled to ', enabled);
  useGtm()?.enable(enabled);
}

export async function toggleClarity(enabled: boolean) {
  console.debug('Clarity toggled to ', enabled);

  if (!('clarity' in window))
    return;

  Clarity.consent(enabled);
}

export function cookieConsentConfig(translations?: CookieConsentConfig['language']['translations']): CookieConsentConfig {
  if (!translations) {
    translations = {
      en: get(defaultMessages.getMessages('en'), 'legal.cookies.consent') as Translation,
    };
  }

  return ({
    cookie: {
      name: 'it24_cc',
      domain: import.meta.env.VITE_CC_COOKIE_DOMAIN || location.hostname,
      expiresAfterDays: 365,
    },
    categories: {
      [CC_CAT_NECESSARY]: {
        enabled: true,
        readOnly: true,
      },
      [CC_CAT_FUNCTIONALITY]: {
        enabled: true,
        autoClear: {
          cookies: [
            { name: /^it24(a|s)_/ },
          ],
        },
      },
      [CC_CAT_ANALYTICS]: {
        enabled: true,
        autoClear: {
          cookies: [
            { name: /^_ga/ },
            { name: /^_clck/ },
            { name: /^_clsk/ },
            { name: /^CLID/ },
            { name: /^ANONCHK/ },
            { name: /^MR/ },
            { name: /^MUID/ },
            { name: /^SM/ },
          ],
        },
      },
    },
    language: {
      default: 'en',
      translations,
    },
    onChange: ({ cookie }) => {
      console.debug('Consent changed');
      const enabled = cookie.categories.includes(CC_CAT_ANALYTICS);

      toggleGA(enabled);
      toggleGTM(enabled);
      toggleClarity(enabled);
    },
    onFirstConsent: ({ cookie }) => {
      console.debug('First consent');
      const enabled = cookie.categories.includes(CC_CAT_ANALYTICS);

      toggleGA(enabled);
      toggleGTM(enabled);
      toggleClarity(enabled);
    },
  });
}
