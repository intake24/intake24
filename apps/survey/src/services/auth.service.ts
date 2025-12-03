import type {
  AliasLoginRequest,
  LoginResponse,
  SurveyAuthResponse,
  TokenLoginRequest,
} from '@intake24/common/types/http';

import { http } from '@intake24/ui';

export default {
  async login(request: AliasLoginRequest): Promise<SurveyAuthResponse> {
    const { data } = await http.post<SurveyAuthResponse>('auth/login/alias', request, {
      withCredentials: true,
    });

    return data;
  },

  async token(request: TokenLoginRequest): Promise<SurveyAuthResponse> {
    const { data } = await http.post<SurveyAuthResponse>(`auth/login/token`, request, {
      withCredentials: true,
    });

    return data;
  },

  async refresh(): Promise<string> {
    const {
      data: { accessToken },
    } = await http.post<LoginResponse>('auth/refresh', null, { withCredentials: true });

    return accessToken;
  },

  async logout(): Promise<void> {
    await http.post('auth/logout', null, { withCredentials: true });
  },
};
