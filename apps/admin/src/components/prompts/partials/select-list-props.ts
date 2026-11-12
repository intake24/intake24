import type { PropType } from 'vue';

import type { LocaleOptionList } from '@intake24/common/types';

export const selectListProps = {
  options: {
    type: Object as PropType<LocaleOptionList>,
    required: true,
  },
  other: {
    type: Boolean,
    required: true,
  },
} as const;
