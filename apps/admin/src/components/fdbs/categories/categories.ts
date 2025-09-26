import type { CategoryReference } from '@intake24/common/types/http/admin';

export interface CategoryListItem extends CategoryReference {
  [key: string]: any;
}
