import type { AxiosResponse } from 'axios';

import type { Logger } from 'winston';
import type { CredentialsV4 } from './credentials';
import type { ApiClientOptionsV4 } from './options';
import fs from 'node:fs';
import axios, { Axios, HttpStatusCode } from 'axios';

import { parse as parseCookie, serialize as serializeCookie } from 'cookie';

import PQueue from 'p-queue';
import type { LoginResponse, RefreshResponse } from '@intake24/common/types/http';

const DEFAULT_REFRESH_TOKEN_COOKIE_NAME = 'it24a_refresh_token';
const DEFAULT_API_LOGIN_RESPONSE_URL = '/api/admin/auth';
const DEFAULT_MAX_CONCURRENT_REQUESTS = 10;
const DEFAULT_REQUEST_RATE_LIMIT = 300;
const DEFAULT_REQUEST_RATE_LIMIT_WINDOW = 5 * 60 * 1000;

export class BaseClientV4 {
  private apiBaseUrl: string;

  private credentials?: CredentialsV4;
  private refreshToken?: string;
  private accessToken?: string;
  private cookieName: string;
  private authResponseUrl: '/api/auth' | '/api/admin/auth';

  public readonly logger: Logger;
  public readonly rawClient: Axios;
  public readonly accessClient: Axios;

  private readonly requestQueue;

  private loginRequest?: Promise<void>;
  private refreshRequest?: Promise<void>;

  public constructor(logger: Logger, options: ApiClientOptionsV4) {
    this.apiBaseUrl = options.apiBaseUrl;
    this.credentials = options.credentials;
    this.accessToken = options.accessToken;
    this.refreshToken = options.refreshToken;
    this.cookieName = options.cookieName ?? DEFAULT_REFRESH_TOKEN_COOKIE_NAME;
    this.authResponseUrl = options.authResponseUrl ?? DEFAULT_API_LOGIN_RESPONSE_URL;

    this.requestQueue = new PQueue({
      concurrency: options.maxConcurrentRequests ?? DEFAULT_MAX_CONCURRENT_REQUESTS,
      interval: options.requestRateLimitWindow ?? DEFAULT_REQUEST_RATE_LIMIT_WINDOW,
      intervalCap: options.requestRateLimit ?? DEFAULT_REQUEST_RATE_LIMIT,
    });

    this.logger = logger.child({ service: 'V4 API' });

    this.rawClient = new Axios({
      ...axios.defaults,
      headers: {},
      validateStatus: null,
      baseURL: this.apiBaseUrl,
    });

    this.accessClient = new Axios({
      ...axios.defaults,
      headers: {},
      validateStatus: null,
      baseURL: this.apiBaseUrl,
    });

    this.accessClient.interceptors.request.use(
      async (config) => {
        this.logger.debug(`Access request: ${config.method} ${config.url}`);

        if (this.accessToken === undefined) {
          this.logger.debug('Access token is undefined');
          await this.refresh();
        }

        config.headers.set('Authorization', `Bearer ${this.accessToken}`);
        return config;
      },
      (error) => {
        throw error;
      },
    );

    this.accessClient.interceptors.response.use(
      async (response) => {
        if (response.status >= 400) {
          const detail = BaseClientV4.extractErrorDetail(response.data);
          const message = BaseClientV4.composeErrorMessage(response, detail);

          if (response.status === HttpStatusCode.Unauthorized) {
            this.logger.debug(
              `Access token rejected for request: ${response.config.method} ${response.config.url}`,
            );

            await this.refresh();

            const response2 = (await this.requestQueue.add(async () =>
              this.rawClient.request({
                ...response.config,
                headers: { ...response.config.headers, Authorization: `Bearer ${this.accessToken}` },
              }),
            )) as AxiosResponse;

            if (response2.status === HttpStatusCode.Unauthorized)
              throw new Error('Access token rejected by the API server again after refreshing.');

            if (response2.status >= 400) {
              const detail2 = BaseClientV4.extractErrorDetail(response2.data);
              const message2 = BaseClientV4.composeErrorMessage(response2, detail2);

              const err2 = new Error(message2);
              (err2 as any).status = response2.status;
              (err2 as any).detail = detail2 ?? response2.data;
              throw err2;
            }

            return response2;
          }

          const err = new Error(message);
          (err as any).status = response.status;
          (err as any).detail = detail ?? response.data;
          throw err;
        }

        return response;
      },
      (error) => {
        throw error;
      },
    );
  }

  private static extractErrorDetail(data: unknown): string | undefined {
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const detail = record.message ?? record.error ?? record.detail;
      if (typeof detail === 'string')
        return detail;
    }

    if (typeof data === 'string')
      return data;

    return undefined;
  }

  private static composeErrorMessage(response: AxiosResponse, detail?: string): string {
    const baseMessage
      = `Unexpected HTTP status: ${response.status} for ${response.config.method?.toUpperCase()} ${response.config.url}`;
    return detail ? `${baseMessage} - ${detail}` : baseMessage;
  }

  private async refreshImpl(): Promise<void> {
    this.logger.debug('Refreshing access token');

    if (this.refreshToken === undefined) {
      this.logger.debug('Refresh token is undefined');

      return this.login();
    }
    else {
      const response = await this.rawClient.post<RefreshResponse>(
        `${this.authResponseUrl}/refresh`,
        undefined,
        {
          headers: {
            Cookie: serializeCookie(this.cookieName, this.refreshToken ?? ''),
          },
        },
      );

      if (response.status === HttpStatusCode.Ok) {
        this.accessToken = response.data.accessToken;
      }
      else if (response.status === HttpStatusCode.Unauthorized) {
        this.logger.debug('Cached refresh token rejected by the API server. Trying to login.');

        return this.login();
      }
      else {
        let errorMessage = `Unexpected status code: ${response.status} (${response.config.url})`;

        const reqBody = response.request?.body;
        if (reqBody !== undefined)
          errorMessage += `\n\n${reqBody}`;
        throw new Error(errorMessage);
      }
    }
  }

  async refresh(): Promise<void> {
    if (this.refreshRequest === undefined) {
      this.refreshRequest = this.refreshImpl();
      await this.refreshRequest;
      this.refreshRequest = undefined;
    }
    else {
      return this.refreshRequest;
    }
  }

  private setRefreshTokenFromResponse(response: AxiosResponse): void {
    const cookies = response.headers['set-cookie'];

    if (cookies === undefined) {
      throw new Error(
        `Missing Set-Cookie header: ${response.config.method} ${response.config.url}`,
      );
    }

    const refreshToken = cookies
      .map(str => parseCookie(str)[this.cookieName])
      .find(value => value !== undefined);

    if (refreshToken === undefined) {
      throw new Error(
        `Expected cookie "${this.cookieName}" missing in response: ${response.config.method} ${response.config.url}`,
      );
    }

    this.refreshToken = refreshToken;
  }

  private async loginImpl(): Promise<void> {
    if (this.credentials === undefined) {
      throw new Error(
        'Cannot sign in because the Intake24 user email or password is not defined. Check for missing environment or configuration variables.',
      );
    }

    this.logger.debug('Signing in with email and password');

    const response = await this.rawClient.post<LoginResponse>(
      `${this.authResponseUrl}/login`,
      this.credentials,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    switch (response.status) {
      case HttpStatusCode.Ok:
        this.setRefreshTokenFromResponse(response);
        this.accessToken = response.data.accessToken;
        break;
      case HttpStatusCode.Unauthorized:
        throw new Error(
          'Authentication credentials (user name and password) rejected by the API server.',
        );
      default:
        throw new Error(`Unexpected status code: ${response.status}`);
    }
  }

  private async login() {
    this.logger.info('Trying to logging in');
    if (this.loginRequest === undefined) {
      this.loginRequest = this.loginImpl();
      await this.loginRequest;
      this.loginRequest = undefined;
    }
    else {
      return this.loginRequest;
    }
  }

  private async rateLimitRequest<Res = any>(
    req: () => Promise<AxiosResponse<Res>>,
  ): Promise<AxiosResponse<Res>> {
    return (await this.requestQueue.add(req)) as AxiosResponse<Res>;
  }

  private onUnexpectedStatus(response: AxiosResponse<any>): Error {
    const message = `Unexpected status code ${response.status} for request: ${response.config.method} ${response.config.url}`;

    this.logger.error(message);

    if (response.data !== undefined)
      this.logger.debug(`Response body: ${JSON.stringify(response.data)}`);

    if (response.request?.data !== undefined)
      this.logger.debug(`Request body: ${JSON.stringify(response.request?.data)}`);

    return new Error(message);
  }

  private checkStatus<T>(response: AxiosResponse<T>, expectedStatus: number[]): void {
    if (!expectedStatus.includes(response.status))
      throw this.onUnexpectedStatus(response);
  }

  private acceptNotFound<T>(response: AxiosResponse<T>): T | null {
    switch (response.status) {
      case HttpStatusCode.Ok:
        return response.data;
      case HttpStatusCode.NotFound:
        return null;
      default:
        throw this.onUnexpectedStatus(response);
    }
  }

  public async get<Res, Req = any>(
    endpoint: string,
    body?: Req,
    params?: Record<string, any>,
    expectedStatus: number[] = [HttpStatusCode.Ok],
  ): Promise<Res> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.get<Res>(endpoint, { data: body, params }),
    );
    this.checkStatus(response, expectedStatus);
    return response.data;
  }

  public async post<Res, Req = any>(
    endpoint: string,
    body?: Req,
    params?: Record<string, any>,
    expectedStatus: number[] = [HttpStatusCode.Ok, HttpStatusCode.Created, HttpStatusCode.Accepted],
  ): Promise<Res> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.post<Res>(endpoint, body, { params }),
    );
    this.checkStatus(response, expectedStatus);
    return response.data;
  }

  public async postResponse<Res, Req = any>(
    endpoint: string,
    body?: Req,
    params?: Record<string, any>,
  ): Promise<AxiosResponse<Res>> {
    return await this.rateLimitRequest(() =>
      this.accessClient.post<Res>(endpoint, body, { params }),
    );
  }

  public async put<Res, Req = any>(
    endpoint: string,
    body?: Req,
    params?: Record<string, any>,
    expectedStatus: number[] = [HttpStatusCode.Ok, HttpStatusCode.Accepted],
  ): Promise<Res> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.put<Res>(endpoint, body, { params }),
    );
    this.checkStatus(response, expectedStatus);
    return response.data;
  }

  public async patch<Res, Req = any>(
    endpoint: string,
    body?: Req,
    params?: Record<string, any>,
    expectedStatus: number[] = [HttpStatusCode.Ok, HttpStatusCode.Accepted],
  ): Promise<Res> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.patch<Res>(endpoint, body, { params }),
    );
    this.checkStatus(response, expectedStatus);
    return response.data;
  }

  public async getOptional<Res, Req = any>(endpoint: string, body?: Req): Promise<Res | null> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.get<Res>(endpoint, { data: body }),
    );
    this.checkStatus(response, [HttpStatusCode.Ok, HttpStatusCode.NotFound]);
    if (response.status === HttpStatusCode.NotFound)
      return null;
    return response.data;
  }

  public async getFile<Req = any>(endpoint: string, destPath: string, _body?: Req): Promise<void> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.get(endpoint, {
        responseType: 'stream',
      }),
    );

    this.checkStatus(response, [HttpStatusCode.Ok]);

    const writer = fs.createWriteStream(destPath);

    response.data.pipe(writer); // Does this need closing?

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  public async delete<Res, _Req = any>(
    endpoint: string,
    params?: Record<string, any>,
    expectedStatus: number[] = [HttpStatusCode.Ok, HttpStatusCode.NoContent],
  ): Promise<Res> {
    const response = await this.rateLimitRequest(() =>
      this.accessClient.delete<Res>(endpoint, { params }),
    );
    this.checkStatus(response, expectedStatus);
    return response.data;
  }
}
