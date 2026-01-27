import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';
import type { PromptSection } from '@intake24/common/surveys';

export function createHandlerProps<P extends keyof Prompts>() {
  return {
    prompt: {
      type: Object as PropType<Prompts[P]>,
      required: true,
    },
    section: {
      type: String as PropType<PromptSection>,
      required: true,
    },
  } as const;
};
