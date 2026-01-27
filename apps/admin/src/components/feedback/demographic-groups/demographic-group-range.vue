<template>
  <v-row>
    <v-col align-self="start" cols="12" md="6">
      <v-switch
        class="my-4"
        hide-details="auto"
        :label="$t(`feedback-schemes.${type}._`)"
        :model-value="!!modelValue"
        :prepend-inner-icon="getIcon(type)"
        @update:model-value="toggleRange($event)"
      />
    </v-col>
    <v-col v-if="modelValue" cols="12" md="6">
      <v-text-field
        class="mb-4"
        density="compact"
        hide-details="auto"
        :label="$t('feedback-schemes.ranges.start')"
        :model-value="modelValue.start"
        :name="`${type}.range.start`"
        variant="outlined"
        @update:model-value="updateRange('start', $event)"
      />
      <v-text-field
        density="compact"
        hide-details="auto"
        :label="$t('feedback-schemes.ranges.end')"
        :model-value="modelValue.end"
        :name="`${type}.range.end`"
        variant="outlined"
        @update:model-value="updateRange('end', $event)"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Range, RangeType } from '@intake24/common/feedback';

import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DemographicGroupRange',

  props: {
    type: {
      type: String as PropType<RangeType>,
      required: true,
    },
    modelValue: {
      type: Object as PropType<Range | null>,
      default: null,
    },
  },

  emits: ['update:modelValue'],

  data() {
    const defaultRange: Range = { start: 0, end: 0 };

    return { defaultRange };
  },

  methods: {
    getIcon(type: RangeType): string {
      const icons = {
        age: 'fas fa-birthday-cake',
        height: 'fas fa-arrows-alt-v',
        weight: 'fas fa-weight',
      };

      return icons[type];
    },

    toggleRange(value: boolean) {
      this.$emit('update:modelValue', value ? this.defaultRange : null);
    },

    updateRange(field: keyof Range, value: string) {
      const range = { ...(this.modelValue ?? this.defaultRange), [field]: Number.parseFloat(value) };

      this.$emit('update:modelValue', range);
    },
  },
});
</script>

<style lang="scss" scoped></style>
