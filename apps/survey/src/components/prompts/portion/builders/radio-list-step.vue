<template>
  <v-sheet class="mb-4">
    {{ translate(step.description) }}
  </v-sheet>
  <v-radio-group
    hide-details="auto"
    :model-value="modelValue.option"
    @update:model-value="update('option', $event)"
  >
    <v-radio
      v-for="option in options"
      :key="typeof option.value === 'string' ? option.value : JSON.stringify(option.value)"
      class="my-1"
      :disabled
      :label="option.label"
      :value="option.value"
    />
  </v-radio-group>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { useI18n } from '@intake24/ui';

import { createStepProps, useStep } from './use-step';

defineOptions({ inheritAttrs: false });
const props = defineProps(createStepProps<'coefficient' | 'condition' | 'lookup-entity' | 'select-entity'>());
const emit = defineEmits(['update:modelValue']);

const { i18n: { locale }, translate } = useI18n();
const { update } = useStep(props, { emit });

const tags = computed(() =>
  [...new Set([...props.entities.categories, ...props.entities.foods]
    .reduce<string[]>((acc, entity) => {
      acc.push(...entity.tags);
      return acc;
    }, []),
  )],
);

const options = computed(() => {
  const { type } = props.step;

  if (type === 'select-entity')
    return props.entities[props.step.resource].map(entity => ({ label: entity.localName, value: entity.code }));

  const options = props.step.options[locale.value] ?? props.step.options.en;
  if (type === 'condition') {
    return options.filter((option) => {
      if (!Array.isArray(option.value))
        return true;

      return option.value.every(condition => condition.property.type === 'tag' && tags.value.includes(condition.property.check.tagId));
    });
  }

  return options;
});
</script>

<style lang="scss">
</style>
