import { defineStore } from 'pinia';
import { authService } from '@intake24/admin/services';
import type {
  LoginRequest,
  MFAChallengeRequest,
  MFAChallengeResponse,
  MFAVerificationRequest,
} from '@intake24/common/types/http';
import { useLoading } from '@intake24/ui/stores';

import { useUser } from './user';

export type AuthState = {
  accessToken: string | null;
  mfa: MFAChallengeResponse | null;
};

export const useAuth = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    mfa: null,
  }),
  getters: {
    loggedIn: state => !!state.accessToken,
  },
  actions: {
    setAccessToken(token: string) {
      useUser().loadPayload(token);
      this.accessToken = token;
    },

    async successfulLogin(accessToken: string) {
      this.setAccessToken(accessToken);
      this.mfa = null;

      const userState = useUser();
      if (!userState.loaded)
        await userState.request();
    },

    mfaRequest(challenge: MFAChallengeResponse) {
      this.accessToken = null;
      this.mfa = challenge;
    },

    async login(payload: LoginRequest) {
      const data = await authService.login(payload);

      if ('accessToken' in data)
        await this.successfulLogin(data.accessToken);
      else this.mfaRequest(data);
    },

    async challenge(request: MFAChallengeRequest) {
      const data = await authService.challenge(request);
      this.mfaRequest(data);
    },

    async verify(request: MFAVerificationRequest) {
      const accessToken = await authService.verify(request);
      await this.successfulLogin(accessToken);
    },

    async refresh(withErr = true) {
      try {
        const accessToken = await authService.refresh();
        await this.successfulLogin(accessToken);
      }
      catch (err) {
        if (withErr)
          throw err;
      }
    },

    async logout(invalidate?: boolean) {
      if (invalidate)
        await authService.logout();

      useLoading().$reset();
      useUser().$reset();
      this.$reset();
    },
  },
});

export type AuthStoreDef = typeof useAuth;

export type AuthStore = ReturnType<AuthStoreDef>;
