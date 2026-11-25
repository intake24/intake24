import type { AwilixContainer } from 'awilix';

import type { RequestIoC } from '@intake24/api/ioc';
import type { AmrMethod, MFAProvider } from '@intake24/common/security';
import type { FrontEnd } from '@intake24/common/types';

declare global {
  namespace Express {
    export interface Request {
      // Indicate whether Authentication Assurance Level (AAL) is satisfied
      aal?: boolean;
      // Depenedency injection container scoped to the request
      scope: AwilixContainer<RequestIoC>;
      // Signature-verified access token subject, set before authentication runs
      rateLimitUser?: { userId: string; frontEnd: FrontEnd };
      rateLimitAccount?: string;
      // Cleared when the device's own login bucket is exhausted
      rateLimitDeviceId?: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    mfaAuthChallenge: {
      challengeId: string;
      deviceId: string;
      provider: MFAProvider;
      userId: string;
      amr: AmrMethod[];
    };
    codeRegChallenge: {
      challengeId: string;
    };
    duoRegChallenge: {
      challengeId: string;
    };
    fidoRegChallenge: {
      challengeId: string;
    };
    otpRegChallenge: {
      challengeId: string;
      secret: string;
    };
    oidc: {
      provider: string;
      pkce: string;
      nonce: string | undefined;
    };
  }
}
