import type { AxiosResponse } from 'axios';
import type { Logger } from 'winston';

import type { CredentialsV3, RefreshResponseV3, SignInRequestV3, SignInResponseV3 } from './types';

import fs from 'node:fs';

import axios, { Axios, HttpStatusCode } from 'axios';
import pLimit from 'p-limit';

export class BaseClientV3 {
  private apiBaseUrl: string;

  private credentials?: CredentialsV3;
  private refreshToken?: string;
  private accessToken?: string;

  public readonly logger: Logger;
  public readonly rawClient: Axios;
  public readonly accessClient: Axios;

  private readonly requestLimit;

  private signInRequest?: Promise<void>;
  private refreshRequest?: Promise<RefreshResponseV3>;

  public constructor(
    apiBaseUrl: string,
    logger: Logger,
    maxConcurrentRequests: number,
    refreshToken?: string,
    credentials?: CredentialsV3,
  ) {
    this.apiBaseUrl = apiBaseUrl;
    this.credentials = credentials;
    this.refreshToken = refreshToken;

    this.requestLimit = pLimit(maxConcurrentRequests);

    this.logger = logger.child({ service: 'V3 API' });

    this.rawClient = new Axios({
      ...axios.defaults,
      headers: {},
      validateStatus: null,
      baseURL: apiBaseUrl,
    });

    this.accessClient = new Axios({
      ...axios.defaults,
      headers: {},
      validateStatus: null,
      baseURL: apiBaseUrl,
    });

    this.accessClient.interceptors.request.use(
      async (config) => {
        this.logger.debug(`Access request: ${config.method} ${config.url}`);

        if (this.accessToken === undefined) {
          this.logger.debug('Access token is undefined');
          await this.refresh();
        }

        config.headers.set('X-Auth-Token', this.accessToken);
        return config;
      },
      (error) => {
        throw error;
      },
    );

    this.accessClient.interceptors.response.use(
      async (response) => {
        if (response.status === HttpStatusCode.Unauthorized) {
          this.logger.debug(
            `Access token rejected for request: ${response.config.method} ${response.config.url}`,
          );

          await this.refresh();

          const response2 = await this.requestLimit(() =>
            this.rawClient.request({
              ...response.config,
              headers: { ...response.config.headers, 'X-Auth-Token': this.accessToken },
            }),
          );

          if (response2.status === HttpStatusCode.Unauthorized)
            throw new Error('Access token rejected by the API server again after refreshing.');

          return response2;
        }
        else {
          return response;
        }
      },
      (error) => {
        throw error;
      },
    );
  }

  private async refreshImpl(): Promise<RefreshResponseV3> {
    this.logger.debug('Refreshing access token');

    if (this.refreshToken === undefined) {
      this.logger.debug('Refresh token is undefined');

      await this.signIn();
    }

    const response = await this.rawClient.post<RefreshResponseV3>('/refresh', undefined, {
      headers: { 'X-Auth-Token': this.refreshToken },
    });

    if (response.status === HttpStatusCode.Ok) {
      this.accessToken = response.data.accessToken;
    }
    else if (response.status === HttpStatusCode.Unauthorized) {
      this.logger.debug(
        'Refresh token rejected by the API server. Trying to sign in to get a new one.',
      );

      await this.signIn();

      const response2 = await this.requestLimit(() =>
        this.rawClient.post<RefreshResponseV3>('/refresh', undefined, {
          headers: { 'X-Auth-Token': this.refreshToken },
        }),
      );

      if (response2.status === HttpStatusCode.Ok)
        this.accessToken = response2.data.accessToken;
      else if (response2.status === HttpStatusCode.Unauthorized)
        throw new Error('Received a new refresh token, but the API server still rejected it.');
      else
        throw new Error(`Unexpected status code: ${response2.status}`);
    }
    else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }

    return response.data;
  }

  private async refresh(): Promise<RefreshResponseV3> {
    if (this.refreshRequest === undefined) {
      this.refreshRequest = this.refreshImpl();
      const response = await this.refreshRequest;
      this.refreshRequest = undefined;
      return response;
    }
    else {
      return this.refreshRequest;
    }
  }

  private async signInImpl(): Promise<void> {
    if (this.credentials === undefined) {
      throw new Error(
        'Cannot sign in because the Intake24 user name or password is not defined. Check for missing environment or configuration variables.',
      );
    }

    const requestData: SignInRequestV3 = {
      email: this.credentials.username,
      password: this.credentials.password,
    };

    this.logger.debug('Signing in with user name and password');

    const response = await this.rawClient.post<SignInResponseV3>('/signin', requestData, {
      headers: { 'Content-Type': 'application/json' },
    });

    switch (response.status) {
      case HttpStatusCode.Ok:
        this.refreshToken = response.data.refreshToken;
        break;
      case HttpStatusCode.Unauthorized:
        throw new Error(
          'Authentication credentials (user name and password) rejected by the API server.',
        );
      default:
        throw new Error(`Unexpected status code: ${response.status}`);
    }
  }

  private async signIn(): Promise<void> {
    if (this.signInRequest === undefined) {
      this.signInRequest = this.signInImpl();
      await this.signInRequest;
      this.signInRequest = undefined;
    }
    else {
      return this.signInRequest;
    }
  }

  private onUnexpectedStatus(response: AxiosResponse<any>): Error {
    const message = `Unexpected status code ${response.status} for request: ${response.config.method} ${response.config.url}`;

    this.logger.error(message);

    if (response.data !== undefined)
      this.logger.error(`Response body: ${JSON.stringify(response.data)}`);

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
    expectedStatus: number[] = [HttpStatusCode.Ok],
  ): Promise<Res> {
    const response = await this.requestLimit(() =>
      this.accessClient.get<Res>(endpoint, { data: body }),
    );
    this.checkStatus(response, expectedStatus);
    return response.data;
  }

  public async getOptional<Res, Req = any>(endpoint: string, body?: Req): Promise<Res | null> {
    const response = await this.requestLimit(() =>
      this.accessClient.get<Res>(endpoint, { data: body }),
    );
    this.checkStatus(response, [HttpStatusCode.Ok, HttpStatusCode.NotFound]);
    if (response.status === HttpStatusCode.NotFound)
      return null;
    return response.data;
  }

  public async getFile<Req = any>(endpoint: string, destPath: string, _body?: Req): Promise<void> {
    const response = await this.requestLimit(() =>
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
}
