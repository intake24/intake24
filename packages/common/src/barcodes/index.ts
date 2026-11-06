import { z } from 'zod';

import { quaggaReaders } from './quagga';
import { strichReaders } from './strich';

export * from './quagga';
export * from './strich';

export const barcodeScanners = ['none', 'quagga', 'strich'] as const;
export type BarcodeScanner = typeof barcodeScanners[number];

export const noneScanner = z.object({
  type: z.literal('none'),
});
export type NoneScanner = z.infer<typeof noneScanner>;

export const baseScanner = z.object({
  feedback: z.record(z.enum(['audio', 'vibration']), z.boolean()),
});

export const quaggaScanner = baseScanner.extend({
  type: z.literal('quagga'),
  readers: z.enum(quaggaReaders).array(),
});
export type QuaggaScanner = z.infer<typeof quaggaScanner>;

export const strichScanner = baseScanner.extend({
  type: z.literal('strich'),
  readers: z.enum(strichReaders).array(),
});
export type StrichScanner = z.infer<typeof strichScanner>;

export const barcodeScannerOptions = z.discriminatedUnion(
  'type',
  [
    noneScanner,
    quaggaScanner,
    strichScanner,
  ],
);
export type BarcodeScannerOptions = z.infer<typeof barcodeScannerOptions>;

export const barcodeReaders = {
  none: [],
  quagga: quaggaReaders,
  strich: strichReaders,
};

export const defaultBarcodeScannerOptions: Record<BarcodeScanner, BarcodeScannerOptions> = {
  none: {
    type: 'none',
  },
  quagga: {
    type: 'quagga',
    readers: [
      'ean_reader',
      'ean_8_reader',
      'ean_5_reader',
      'ean_2_reader',
    ],
    feedback: { audio: false, vibration: true },
  },
  strich: {
    type: 'strich',
    readers: ['ean13', 'ean8'],
    feedback: { audio: false, vibration: true },
  },
};
