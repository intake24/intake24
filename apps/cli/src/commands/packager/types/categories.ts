import type {
  PkgInheritableAttributes,
  PkgPortionSizeMethod,
} from '@intake24/cli/commands/packager/types/foods';

export interface PkgCategory {
  version?: string;
  code: string;
  englishName: string;
  name: string;
  hidden: boolean;
  attributes: PkgInheritableAttributes;
  parentCategories: string[];
  portionSize: PkgPortionSizeMethod[];
}
