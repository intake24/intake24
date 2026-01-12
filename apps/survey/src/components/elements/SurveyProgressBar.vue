<template>
  <div class="survey-progress">
    <v-chip-group>
      <div v-for="(item, idx) in meals" :key="idx" class="d-flex flex-column justify-start">
        <v-chip
          class="font-weight-medium"
          :color="color(item)"
          label
        >
          {{ stringTime(item.time) }}
        </v-chip>
        <span class="text-caption">{{ translate(item.name) }}</span>
      </div>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import type { MealState } from '@intake24/common/surveys';
import type { Time } from '@intake24/common/util';
import { fromTime } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

export default defineComponent({
  name: 'SurveyProgressBar',

  props: {
    meals: {
      type: Array as PropType<MealState[]>,
      required: true,
    },
  },

  setup() {
    const { translate } = useI18n();
    const stringTime = (time: Time | undefined): string => {
      if (time === undefined)
        return '?';
      return fromTime(time);
    };

    const color = (item: MealState) => {
      if (!item.time)
        return 'secondary';
      if (item.foods.length === 0)
        return 'primary';
      //   const finishedRecall = item.foods.reduce();
      return 'success';
    };

    return { color, stringTime, translate };
  },
});
</script>

<style lang="scss">
.survey-progress {
  .v-chip-group .v-chip {
    display: block;
    margin: 4px 2px 4px 0;
    padding: 0 4px;
  }

  .v-slide-group__content {
    flex-shrink: 1;
    white-space: initial;
  }
}
</style>
