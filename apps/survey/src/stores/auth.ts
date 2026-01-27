import type {
  AliasLoginRequest,
  ChallengeResponse,
  TokenLoginRequest,
} from '@intake24/common/types/http';

import { defineStore } from 'pinia';

import { useLoading } from '@intake24/ui/stores';

import { authService } from '../services';
import { useUser } from './user';

export type AuthState = {
  accessToken: string | null;
  challenge: ChallengeResponse | null;
};

export type LoginPayload = { type: 'login'; payload: AliasLoginRequest };
export type TokenPayload = { type: 'token'; payload: TokenLoginRequest };
export type AuthenticatePayload = LoginPayload | TokenPayload;

export const useAuth = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: null,
    challenge: null,
  }),
  getters: {
    loggedIn: state => !!state.accessToken,
  },
  actions: {
    setAccessToken(token: string) {
      useUser().load(token);
      this.accessToken = token;
    },

    successfulLogin(accessToken: string) {
      this.setAccessToken(accessToken);
      this.challenge = null;
    },

    challengeRequest(challenge: ChallengeResponse) {
      this.accessToken = null;
      this.challenge = challenge;
    },

    async authenticate({ type, payload }: AuthenticatePayload) {
      const loading = useLoading();
      loading.addItem('login');

      try {
        const data
          = type === 'login' ? await authService.login(payload) : await authService.token(payload);

        if ('accessToken' in data)
          this.successfulLogin(data.accessToken);
        else this.challengeRequest(data);
      }
      finally {
        loading.removeItem('login');
      }
    },

    async login(payload: AliasLoginRequest) {
      await this.authenticate({ type: 'login', payload });
    },

    async token(payload: TokenLoginRequest) {
      await this.authenticate({ type: 'token', payload });
    },

    async refresh(withErr = true) {
      try {
        const accessToken = await authService.refresh();
        this.successfulLogin(accessToken);
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
