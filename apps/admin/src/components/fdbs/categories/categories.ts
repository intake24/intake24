import type { CategoryAttributes } from '@intake24/common/types/http/admin';

export type CategoryListItem = Pick<CategoryAttributes, 'id' | 'code' | 'name'>;
