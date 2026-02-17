import { z } from 'zod';

import { validateConfig } from '@intake24/common-backend';

export const pdfConfig = z.object({
  puppeteer: z.object({
    headless: z.union([z.literal('shell'), z.boolean(), z.stringbool()]).default(true),
    lang: z.string().optional(),
  }),
});
export type PdfConfig = z.infer<typeof pdfConfig>;
export type PuppeteerOptions = PdfConfig['puppeteer'];

const parsedPdfConfig = validateConfig('PDF configuration', pdfConfig, {
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS,
    lang: process.env.PUPPETEER_LANG,
  },
});

export default parsedPdfConfig;
