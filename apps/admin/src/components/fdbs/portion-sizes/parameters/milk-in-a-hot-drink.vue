<template>
  <v-row>
    <v-col cols="12">
      <language-selector
        v-model="parameters.options"
        :default="[]"
        :label="$t('fdbs.portionSizes.methods.parent-food-portion.options')"
        :readonly
        :required="true"
      >
        <template v-for="lang in Object.keys(parameters.options)" :key="lang" #[`lang.${lang}`]>
          <options-list
            :options="parameters.options[lang]"
            :rules="rules"
            @update:options="updateOption(lang, $event)"
          />
        </template>
      </language-selector>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { OptionsList } from '@intake24/admin/components/lists';
import type { PortionSizeParameters } from '@intake24/common/surveys';
import type { ListOption } from '@intake24/common/types';
import { useParameters } from './use-parameters';

defineOptions({ name: 'MilkInAHotDrinkParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['milk-in-a-hot-drink']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'milk-in-a-hot-drink'>(props, { emit });

const rules = [
  (value: any): boolean | string => {
    const msg = 'Value must be greater than 0';
    const number = Number.parseFloat(value);
    if (Number.isNaN(number))
      return msg;

    return number > 0 || msg;
  },
];

function updateOption(lang: string, value: ListOption[]) {
  parameters.value.options[lang] = value.map(item => ({
    ...item,
    value: Number.parseFloat(item.value),
  }));
}
</script>
