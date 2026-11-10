import type { CookieData } from 'puppeteer';

import type { PuppeteerOptions } from '@intake24/api/config';

import { Readable } from 'node:stream';

import puppeteer from 'puppeteer';

export default class FeedbackPdfGenerator {
  readonly url;
  readonly refreshCookie;
  readonly options;

  constructor(url: string, cookie: CookieData, options: PuppeteerOptions) {
    this.url = url;
    this.refreshCookie = cookie;
    this.options = options;
  }

  /**
   * The browser is closed when `close` is called or `signal` aborts, whichever comes first.
   */
  private async launchBrowser(signal?: AbortSignal) {
    signal?.throwIfAborted();

    const args: string[] = [];

    if (this.options.lang)
      args.push(`--lang=${this.options.lang}`);

    const browser = await puppeteer.launch({ headless: this.options.headless, args });

    let closing: Promise<void> | undefined;
    const close = () => {
      closing ??= browser.close();
      return closing;
    };

    if (signal?.aborted) {
      await close();
      signal.throwIfAborted();
    }
    signal?.addEventListener('abort', () => void close(), { once: true });

    return { browser, close };
  }

  async loadFeedback(signal?: AbortSignal) {
    const { browser, close } = await this.launchBrowser(signal);

    try {
      await browser.setCookie(this.refreshCookie);
      const page = await browser.newPage();
      await page.emulateMediaType('print');

      if (this.options.lang) {
        const store = JSON.stringify({ lang: this.options.lang });
        await page.evaluateOnNewDocument((store) => {
          // TODO: hardcoded default prefix
          // @ts-expect-error types
          window.localStorage.setItem('it24s_app', store);
        }, store);
      }

      await page.goto(this.url, { waitUntil: 'networkidle0' });

      return { page, close };
    }
    catch (error) {
      await close();
      signal?.throwIfAborted();
      throw error;
    }
  }

  /**
   * Get PDF stream
   *
   * @param signal aborting closes the browser, e.g. when the client disconnects
   * @returns
   * @memberof FeedbackPdfGenerator
   */
  async getPdfStream(signal: AbortSignal) {
    const { page, close } = await this.loadFeedback(signal);

    let pdfStream;
    try {
      const pdfWebStream = await page.createPDFStream({
        format: 'a4',
        displayHeaderFooter: true,
        printBackground: true,
      });
      pdfStream = Readable.fromWeb(pdfWebStream);
    }
    catch (error) {
      await close();
      signal.throwIfAborted();
      throw error;
    }

    // `pipe()` does not handle source errors, so the 'error' listener also keeps an errored stream from crashing the process.
    pdfStream
      .on('error', () => void close())
      .on('close', () => void close());

    return pdfStream;
  }

  /**
   * Generate PDF file to disk
   *
   * @param {string} path
   * @memberof FeedbackPdfGenerator
   */
  async getPdfFile(path: string) {
    const { page, close } = await this.loadFeedback();

    try {
      await page.pdf({
        path,
        format: 'a4',
        displayHeaderFooter: true,
        printBackground: true,
      });
    }
    finally {
      await close();
    }

    return path;
  }
}
