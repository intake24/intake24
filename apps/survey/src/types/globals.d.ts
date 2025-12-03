import type { HttpClient } from '@intake24/ui';

declare module 'vue' {
  interface ComponentCustomProperties {
    $http: HttpClient;

    // loading mixin
    isAppLoading: boolean;
  }
}

declare global {
  interface Navigator {
    userLanguage: string;
  }
}
