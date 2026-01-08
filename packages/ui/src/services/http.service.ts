import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import axiosRetry, { linearDelay } from 'axios-retry';
import { trim } from 'lodash-es';

export type SubscribeCallback = (err?: AxiosError) => void;

export interface HttpRequestConfig<D = any> extends AxiosRequestConfig<D> {
  withLoading?: boolean;
}

export interface HttpClient {
  axios: AxiosInstance;
  get: <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: HttpRequestConfig<D>,
  ) => Promise<R>;
  post: <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D>,
  ) => Promise<R>;
  put: <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D>,
  ) => Promise<R>;
  patch: <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D>,
  ) => Promise<R>;
  delete: <T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: HttpRequestConfig<D>,
  ) => Promise<R>;
  request: <T = any, R = AxiosResponse<T>, D = any>(config: HttpRequestConfig<D>) => Promise<R>;
}

const httpClient: HttpClient = {
  axios: axios.create({
    baseURL: [import.meta.env.VITE_API_HOST, import.meta.env.VITE_API_URL]
      .map(item => trim(item, '/'))
      .join('/'),
    headers: { common: { 'X-Requested-With': 'XMLHttpRequest' } },
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
    return this.request({ url, method: 'patch', data, ...config });
  },

  async delete(url, config) {
    return this.request({ url, method: 'delete', ...config });
  },

  async request<T = any, R = AxiosResponse<T>, D = any>(config: HttpRequestConfig<D>): Promise<R> {
    return this.axios.request<T, R, D>(config);
  },
};

axiosRetry(httpClient.axios, { retries: 5, retryDelay: linearDelay(300) });

export default httpClient;

export const useHttp = () => httpClient;
