import type { CookieData } from 'puppeteer';
import { Readable } from 'node:stream';
import puppeteer from 'puppeteer';
import type { PuppeteerOptions } from '@intake24/api/config';

export default class FeedbackPdfGenerator {
  readonly url;
  readonly refreshCookie;
  readonly options;

  constructor(url: string, cookie: CookieData, options: PuppeteerOptions) {
    this.url = url;
    this.refreshCookie = cookie;
    this.options = options;
  }

  async loadFeedback() {
    const args: string[] = [];

    if (this.options.lang)
      args.push(`--lang=${this.options.lang}`);

    const browser = await puppeteer.launch({ headless: this.options.headless, args });

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

      return page;
    }
    catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Get PDf buffer
   *
   * @returns
   * @memberof FeedbackPdfGenerator
   */
  async getPdf() {
    const page = await this.loadFeedback();

    const pdfBuffer = await page.pdf({
      format: 'a4',
      displayHeaderFooter: true,
      printBackground: true,
    });

    await page.browser().close();

    return pdfBuffer;
  }

  /**
   * Get PDF stream
   *
   * @returns
   * @memberof FeedbackPdfGenerator
   */
  async getPdfStream() {
    const page = await this.loadFeedback();

    const pdfWebStream = await page.createPDFStream({
      format: 'a4',
      displayHeaderFooter: true,
      printBackground: true,
    });
    const pdfBuffer = Readable.fromWeb(pdfWebStream);

    pdfBuffer
      .on('end', async () => {
        await page.browser().close();
      })
      .on('error', async () => {
        await page.browser().close();
      });

    return pdfBuffer;
  }

  /**
   * Generate PDF file to disk
   *
   * @param {string} path
   * @memberof FeedbackPdfGenerator
   */
  async getPdfFile(path: string) {
    const page = await this.loadFeedback();

    await page.pdf({
      path,
      format: 'a4',
      displayHeaderFooter: true,
      printBackground: true,
    });

    await page.browser().close();

    return path;
  }
}
