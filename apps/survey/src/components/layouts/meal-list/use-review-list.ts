import type { SetupContext } from 'vue';

import type { ReviewOptions } from '@intake24/common/prompts';

import { ref, watch } from 'vue';

export type UseReviewListProps = {
  review: ReviewOptions;
};

export function useReviewList(props: UseReviewListProps, ctx: SetupContext<('bottom-reached' | 'reviewed')[]>) {
  const bottomReached = ref(false);
  const reviewed = ref<string[]>([]);

  const bottomIntersect = (isIntersecting: boolean) => {
    if (bottomReached.value || !isIntersecting)
      return;

    bottomReached.value = true;
    ctx.emit('bottom-reached', true);
  };

  watch(reviewed, (val) => {
    ctx.emit('reviewed', val);
  });

  return {
    bottomIntersect,
    bottomReached,
    reviewed,
  };
}
