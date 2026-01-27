import type { PropType } from 'vue';

import type { TimePicker } from '@intake24/common/prompts';

export const timerPickerProps = {
  allowedMinutes: {
    type: Number as PropType<TimePicker['allowedMinutes']>,
    required: true,
  },
  amPmToggle: {
    type: Boolean as PropType<TimePicker['amPmToggle']>,
    required: true,
  },
  format: {
    type: String as PropType<TimePicker['format']>,
    required: true,
  },
  ui: {
    type: String as PropType<TimePicker['ui']>,
    required: true,
  },
} as const;
