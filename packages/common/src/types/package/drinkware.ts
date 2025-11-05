import type { LocaleTranslation } from '@intake24/common/types';

export type PkgDrinkScaleV1 = {
  version: 1;
  label: string;
  width: number;
  height: number;
  emptyLevel: number;
  fullLevel: number;
  baseImagePath: string;
  overlayImagePath: string;
  volumeSamples: number[];
};

export type PkgDrinkScaleV2 = {
  version: 2;
  label: LocaleTranslation;
  baseImagePath: string;
  outlineCoordinates: number[];
  volumeSamples: number[];
  volumeMethod: 'lookUpTable' | 'cylindrical';
};

export type PkgDrinkScale = PkgDrinkScaleV1 | PkgDrinkScaleV2;

export type PkgDrinkwareSet = {
  description: string;
  selectionImageMapId: string;
  scales: Record<number, PkgDrinkScale>;
  label?: Record<string, string>;
};
