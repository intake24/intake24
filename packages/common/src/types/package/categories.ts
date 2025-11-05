import { PkgInheritableAttributes, PkgPortionSizeMethod } from './foods';

export type PkgCategory = {
  version?: string;
  code: string;
  englishName: string;
  name: string;
  hidden: boolean;
  attributes: PkgInheritableAttributes;
  parentCategories: string[];
  portionSize: PkgPortionSizeMethod[];
};
