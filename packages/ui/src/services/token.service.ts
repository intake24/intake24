import type { TokenPayload } from '@intake24/common/security';
import type { FrontEnd } from '@intake24/common/types';

import { jwtDecode } from 'jwt-decode';

export default {
  decodeAccessToken<T extends TokenPayload>(accessToken: string, frontEnd: FrontEnd): T {
    const payload = jwtDecode<T>(accessToken);
    const { userId, aud, exp } = payload;

    if (!aud.includes('access') || !aud.includes(frontEnd))
      throw new Error('JWT: invalid audience claims');

    if (!userId)
      throw new Error('JWT: Missing userId claim');

    if (new Date().getTime() > exp * 1000)
      throw new Error('JWT: expired token');

    return payload;
  },
};
