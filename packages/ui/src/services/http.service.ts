import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosResponseDefault } from 'axios';

import axios from 'axios';
import axiosRetry, { linearDelay } from 'axios-retry';
import { trim } from 'lodash-es';

export type SubscribeCallback = (err?: AxiosError) => void;

export interface HttpRequestConfig<D = any, P = any> extends AxiosRequestConfig<D, P> {
  withLoading?: boolean;
  withErr?: boolean;
}

// Mirrors axios' unexported AxiosResponseResult: R defaults to a sentinel resolved to AxiosResponse<T, D, {}, P>
export type HttpResponseResult<T = any, R = AxiosResponseDefault, D = any, P = any> = R extends AxiosResponseDefault
// eslint-disable-next-line ts/no-empty-object-type
  ? AxiosResponse<T, D, {}, P>
  : R;

export interface HttpClient {
  axios: AxiosInstance;
  get: <T = any, R = AxiosResponseDefault, D = any, P = any>(
    url: string,
    config?: HttpRequestConfig<D, P>,
  ) => Promise<HttpResponseResult<T, R, D, P>>;
  post: <T = any, R = AxiosResponseDefault, D = any, P = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D, P>,
  ) => Promise<HttpResponseResult<T, R, D, P>>;
  put: <T = any, R = AxiosResponseDefault, D = any, P = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D, P>,
  ) => Promise<HttpResponseResult<T, R, D, P>>;
  patch: <T = any, R = AxiosResponseDefault, D = any, P = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D, P>,
  ) => Promise<HttpResponseResult<T, R, D, P>>;
  delete: <T = any, R = AxiosResponseDefault, D = any, P = any>(
    url: string,
    config?: HttpRequestConfig<D, P>,
  ) => Promise<HttpResponseResult<T, R, D, P>>;
  request: <T = any, R = AxiosResponseDefault, D = any, P = any>(config: HttpRequestConfig<D, P>) => Promise<HttpResponseResult<T, R, D, P>>;
}

const httpClient: HttpClient = {
  axios: axios.create({
    baseURL: [import.meta.env.VITE_API_HOST, import.meta.env.VITE_API_URL]
      .map(item => trim(item, '/'))
      .join('/'),
    headers: {
      common: { 'X-Requested-With': 'XMLHttpRequest' },
    },
    paramsSerializer: {
      indexes: null,
    },
  }),

  async get(url, config) {
    return this.request({ url, method: 'get', ...config });
  },

  async post(url, data, config) {
    return this.request({ url, method: 'post', data, ...config });
  },

  async put(url, data, config) {
    return this.request({ url, method: 'put', data, ...config });
  },

  async patch(url, data, config) {
    return this.request({
      url,
      method: 'patch',
      data,
      ...config,
    });
  },

  async delete(url, config) {
    return this.request({ url, method: 'delete', ...config });
  },

  async request<T = any, R = AxiosResponseDefault, D = any, P = any>(config: HttpRequestConfig<D, P>): Promise<HttpResponseResult<T, R, D, P>> {
    return await this.axios.request<T, R, D, P>(config);
  },
};

axiosRetry(httpClient.axios, {
  retries: 5,
  retryDelay: linearDelay(300),
});

export default httpClient;

export const useHttp = () => httpClient;
