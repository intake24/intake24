/// <reference types="vite/client" />

import type { CaptchaProvider } from '@intake24/common/security';

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_BASE_URL: string;
  readonly VITE_APP_PREFIX: string;

  readonly VITE_API_HOST: string;
  readonly VITE_API_URL: string;

  readonly VITE_CAPTCHA_PROVIDER: CaptchaProvider;
  readonly VITE_CAPTCHA_SITEKEY: string;

  readonly VITE_CC_COOKIE_DOMAIN: string;
  readonly VITE_GOOGLE_ANALYTICS_ID: string;
  readonly VITE_GTM_CONTAINER_ID: string;
  readonly VITE_CLARITY_PROJECT_ID: string;
  readonly VITE_STRICH_KEY: string;
  readonly VITE_WEBPUSH_PUBLIC_KEY: string;

  readonly VITE_LEGAL_HOME: string;
  readonly VITE_LEGAL_COPYRIGHT: string;
  readonly VITE_LEGAL_PRIVACY: string;
  readonly VITE_LEGAL_TERMS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
