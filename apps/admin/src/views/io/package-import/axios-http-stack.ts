import type { AxiosInstance, AxiosResponse } from 'axios';
import type { HttpRequest, HttpResponse, HttpStack } from 'tus-js-client';

import axios from 'axios';

/*
 * tus-js-client HTTP stack on top of the shared axios instance, so uploads get the
 * auth header and token refresh interceptors like every other admin request.
 */

class AxiosHttpResponse implements HttpResponse {
  constructor(private readonly axiosResponse: AxiosResponse) {}

  getStatus(): number {
    return this.axiosResponse.status;
  }

  getHeader(header: string): string | undefined {
    return this.axiosResponse.headers[header.toLowerCase()];
  }

  getBody(): any {
    return this.axiosResponse.data;
  }

  getUnderlyingObject(): any {
    return this.axiosResponse;
  }
}

class AxiosHttpRequest implements HttpRequest {
  private readonly headers: Record<string, string> = {};
  private readonly controller = new AbortController();
  private progressHandler: ((bytesSent: number) => void) | null = null;

  constructor(
    private readonly method: string,
    private readonly url: string,
    private readonly axiosInstance: AxiosInstance,
  ) {}

  getMethod(): string {
    return this.method;
  }

  getURL(): string {
    return this.url;
  }

  setHeader(header: string, value: string): void {
    this.headers[header] = value;
  }

  getHeader(header: string): string | undefined {
    return this.headers[header];
  }

  setProgressHandler(handler: (bytesSent: number) => void): void {
    this.progressHandler = handler;
  }

  async send(body: any = null): Promise<HttpResponse> {
    try {
      const response = await this.axiosInstance.request({
        method: this.method,
        url: this.url,
        headers: { ...this.headers },
        data: body,
        signal: this.controller.signal,
        onUploadProgress: (event) => {
          this.progressHandler?.(event.loaded);
        },
      });

      return new AxiosHttpResponse(response);
    }
    catch (err) {
      // Axios rejects non-2xx responses. Hand them to tus as responses, so it can read the
      // status code (for error reporting) and doesn't retry requests that can't succeed.
      if (axios.isAxiosError(err) && err.response)
        return new AxiosHttpResponse(err.response);

      throw err;
    }
  }

  async abort(): Promise<void> {
    this.controller.abort();
  }

  getUnderlyingObject(): AbortController {
    return this.controller;
  }
}

export class AxiosHttpStack implements HttpStack {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  createRequest(method: string, url: string): HttpRequest {
    return new AxiosHttpRequest(method, url, this.axiosInstance);
  }

  getName(): string {
    return 'axios-http-stack';
  }
}
