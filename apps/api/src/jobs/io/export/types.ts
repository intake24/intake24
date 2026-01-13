import type { PackageExportOptions } from '@intake24/common/types/http/admin';
import type { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import type { PkgV2Category } from '@intake24/common/types/package/categories';
import type { PkgV2DrinkwareSet } from '@intake24/common/types/package/drinkware';
import type { PkgV2Food } from '@intake24/common/types/package/foods';
import type { PkgV2GuideImage } from '@intake24/common/types/package/guide-image';
import type { PkgV2ImageMap } from '@intake24/common/types/package/image-map';
import type { PkgV2Locale } from '@intake24/common/types/package/locale';

export interface PackageWriter
{
  writeFood: (localeId: string, food: PkgV2Food) => Promise<void>;
  writeCategory: (localeId: string, category: PkgV2Category) => Promise<void>;
  writeLocale: (locale: PkgV2Locale) => Promise<void>;
  writeAsServedSet: (asServedSet: PkgV2AsServedSet) => Promise<void>;
  writeImageMap: (imageMap: PkgV2ImageMap) => Promise<void>;
  writeGuideImage: (guideImage: PkgV2GuideImage) => Promise<void>;
  writeDrinkwareSet: (drinkwareSet: PkgV2DrinkwareSet) => Promise<void>;
  finish: () => Promise<void>;
}

export type PackageWriterFactory = (path: string, options: PackageExportOptions) => Promise<PackageWriter>;

export type PackageWriters = {
  [K in PackageExportOptions['format']]: PackageWriterFactory;
};
