import { z } from 'zod';

import { pkgV2AsServedSet } from './as-served';
import { pkgV2Category } from './categories';
import { pkgV2DrinkwareSet } from './drinkware';
import { pkgV2Food } from './foods';
import { pkgV2GuideImage } from './guide-image';
import { pkgV2ImageMap } from './image-map';
import { pkgV2Locale } from './locale';

export const pkgV2FoodsFileSchema = z.record(z.string(), z.array(pkgV2Food));
export const pkgV2CategoriesFileSchema = z.record(z.string(), z.array(pkgV2Category));
export const pkgV2AsServedSetsFileSchema = z.array(pkgV2AsServedSet);
export const pkgV2ImageMapsFileSchema = z.array(pkgV2ImageMap);
export const pkgV2GuideImagesFileSchema = z.array(pkgV2GuideImage);
export const pkgV2DrinkwareSetsFileSchema = z.array(pkgV2DrinkwareSet);
export const pkgV2LocalesFileSchema = z.array(pkgV2Locale);

export type PkgV2FoodsFile = z.infer<typeof pkgV2FoodsFileSchema>;
export type PkgV2CategoriesFile = z.infer<typeof pkgV2CategoriesFileSchema>;
export type PkgV2AsServedSetsFile = z.infer<typeof pkgV2AsServedSetsFileSchema>;
export type PkgV2ImageMapsFile = z.infer<typeof pkgV2ImageMapsFileSchema>;
export type PkgV2GuideImagesFile = z.infer<typeof pkgV2GuideImagesFileSchema>;
export type PkgV2DrinkwareSetsFile = z.infer<typeof pkgV2DrinkwareSetsFileSchema>;
export type PkgV2LocalesFile = z.infer<typeof pkgV2LocalesFileSchema>;
