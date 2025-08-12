import type CookieConsent from 'vanilla-cookieconsent';

import type { Permission } from './common';
import type { HttpClient } from './http';

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
