import type {
  AdminAuthResponse,
  LoginRequest,
  LoginResponse,
  MFAChallengeRequest,
  MFAChallengeResponse,
  MFAVerificationRequest,
} from '@intake24/common/types/http';

import { http } from '@intake24/ui';

export default {
  /**
   * Login the user and store the access token to token service.
   *
   * @param {LoginRequest} request
   * @returns {Promise<AdminAuthResponse>}
   */
  async login(request: LoginRequest): Promise<AdminAuthResponse> {
    const { data } = await http.post<AdminAuthResponse>('admin/auth/login', request, {
      withLoading: true,
    });

    return data;
  },

  /**
   * Generate OIDC redirect URL for the given provider.
   * @param provider
   * @returns
   */
  async oidcRedirect(provider: string): Promise<{ url: string }> {
    const { data } = await http.get<{ url: string }>(`admin/auth/oidc/${provider}`, { withLoading: true });

    return data;
  },

  /**
   * Handle OIDC callback and return access token.
   * @param provider
   * @param url
   * @returns {Promise<LoginResponse>}
   */
  async oidcCallback(provider: string, url: string): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>(`admin/auth/oidc/${provider}`, { url }, { withLoading: true });

    return data;
  },

  /**
   * Request multi-factor challenge response
   *
   * @param {MFAChallengeRequest} payload
   * @returns {Promise<string>}
   */
  async challenge(payload: MFAChallengeRequest): Promise<MFAChallengeResponse> {
    const { data } = await http.post<MFAChallengeResponse>('admin/auth/challenge', payload, { withLoading: true });

    return data;
  },

  /**
   * Verify multi-factor challenge response
   *
   * @param {MFAVerificationRequest} payload
   * @returns {Promise<string>}
   */
  async verify(payload: MFAVerificationRequest): Promise<string> {
    const { data: { accessToken } } = await http.post<LoginResponse>('admin/auth/verify', payload, { withLoading: true });

    return accessToken;
  },

  /**
   * Refresh access token and store the access token to token service.
   *
   * @returns {Promise<string>}
   */
  async refresh(): Promise<string> {
    const { data: { accessToken } } = await http.post<LoginResponse>('admin/auth/refresh');

    return accessToken;
  },

  /**
   * Logout user
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    await http.post('admin/auth/logout');
  },
};
