import type { AxiosError } from 'axios';
import type { Router } from 'vue-router';
import type { AuthStoreDef } from '../stores';
import { HttpStatusCode } from 'axios';
import type { SubscribeCallback } from '@intake24/ui';
import { http } from '@intake24/ui';

let isRefreshing = false;
let tokenSubscribers: SubscribeCallback[] = [];

const subscribeTokenRefresh = (cb: SubscribeCallback) => tokenSubscribers.push(cb);

function onTokenRefreshed(errRefreshing?: AxiosError) {
  return tokenSubscribers.map(cb => cb(errRefreshing));
}

export function mountInterceptors(router: Router, useAuth: AuthStoreDef) {
  function mountBearerInterceptor(useAuth: AuthStoreDef) {
    http.axios.interceptors.request.use((request) => {
      const { accessToken } = useAuth();

      if (accessToken)
        request.headers.Authorization = `Bearer ${accessToken}`;

      return request;
    });
  }

  function mount401Interceptor(router: Router, useAuth: AuthStoreDef) {
    const auth = useAuth();

    http.axios.interceptors.response.use(
      response => response,
      async (err: AxiosError) => {
        const { config, response: { status } = {} } = err;

        // Exclude non-401s and sign-in 401s (/login)
        if (
          !config?.url
          || status !== HttpStatusCode.Unauthorized
          || config.url?.match(/auth\/(login|fido|duo|otp)$/)
        ) {
          return Promise.reject(err);
        }

        // Refresh token has failed. Logout the user
        if (config.url?.includes('auth/refresh')) {
          isRefreshing = false;

          await auth.logout();
          if (!router.currentRoute.value.meta?.public)
            router.push({ name: 'login' });

          return Promise.reject(err);
        }

        if (!isRefreshing) {
          isRefreshing = true;

          auth
            .refresh()
            .then(() => {
              isRefreshing = false;
              onTokenRefreshed();
              tokenSubscribers = [];
            })
            .catch(() => {
              isRefreshing = false;
              onTokenRefreshed(err);
              tokenSubscribers = [];
            });
        }

        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((errRefreshing) => {
            if (errRefreshing)
              return reject(errRefreshing);

            return resolve(http.axios(config));
          });
        });
      },
    );
  }

  mountBearerInterceptor(useAuth);
  mount401Interceptor(router, useAuth);
}
