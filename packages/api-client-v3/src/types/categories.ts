import type { InheritableAttributesV3, PortionSizeMethodV3 } from '@intake24/api-client-v3';

export interface CategoryHeaderV3 {
  code: string;
  englishDescription: string;
  localDescription: string[];
  hidden: boolean;
}

export interface MainCategoryRecordV3 {
  version: string;
  code: string;
  englishDescription: string;
  hidden: boolean;
  attributes: InheritableAttributesV3;
  parentCategories: CategoryHeaderV3[];
}

export interface LocalCategoryRecordV3 {
  version: string | null;
  localDescription: string[];
  portionSize: PortionSizeMethodV3[];
}

export interface CategoryRecordV3 {
  main: MainCategoryRecordV3;
  local: LocalCategoryRecordV3;
}
