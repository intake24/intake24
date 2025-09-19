import type { AwilixContainer } from 'awilix';
import type { RequestIoC } from '@intake24/api/ioc';
import type { AmrMethod, MFAProvider } from '@intake24/common/security';

declare global {
  namespace Express {
    export interface Request {
      // Indicate whether Authentication Assurance Level (AAL) is satisfied
      aal?: boolean;
      // Depenedency injection container scoped to the request
      scope: AwilixContainer<RequestIoC>;
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
  }
}
