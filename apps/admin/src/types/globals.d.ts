import type { HttpClient, Permission } from '@intake24/ui';

declare module 'vue' {
  interface ComponentCustomProperties {
    $http: HttpClient;

    // authMixin
    can: (permission: string | string[] | Permission) => boolean;

    // loadingMixin
    isAppLoading: boolean;

    // moduleMixin
    module: string;
  }
}

declare global {
  interface Navigator {
    userLanguage: string;
  }
}
