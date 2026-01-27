import type CookieConsent from 'vanilla-cookieconsent';

import type { HttpClient, Permission } from '../services';

declare module 'vue' {
  interface ComponentCustomProperties {
    $http: HttpClient;

    // authMixin
    can: (permission: string | string[] | Permission) => boolean;

    // loadingMixin
    isAppLoading: boolean;

    // moduleMixin
    module: string;

    $cc: CookieConsent;
  }
}

declare global {
  interface Navigator {
    userLanguage: string;
  }
}
