<template>
  <div class="d-flex flex-row ga-2">
    <div>
      <select-resource item-id="code" :readonly resource="categories" @update:model-value="addCategory">
        <template #activator="{ props }">
          <v-btn class="mb-4" color="primary" v-bind="props" :disabled="readonly">
            <v-icon icon="$add" start />
            {{ $t(`fdbs.categories.add`) }}
          </v-btn>
        </template>
        <template #title>
          {{ $t(`fdbs.categories.title`) }}
        </template>
        <template #item="{ item }">
          <v-list-item-title>{{ item.code }}</v-list-item-title>
          <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
        </template>
      </select-resource>
      <v-tabs v-model="selected" direction="vertical">
        <v-tab v-for="(option, cat) in parameters.options" :key="cat" :value="cat">
          <v-icon icon="$categories" start />{{ cat }}
        </v-tab>
      </v-tabs>
    </div>
    <v-tabs-window v-model="selected" class="flex-grow-1">
      <v-tabs-window-item v-for="(option, cat) in parameters.options" :key="cat" class="pl-3" :value="cat">
        <div class="d-flex flex-column">
          <language-selector
            v-model="parameters.options[cat]"
            border
            :default="[]"
            :label="$t('fdbs.portionSizes.methods.parent-food-portion.options')"
            :readonly
            :required="true"
          >
            <template v-for="lang in Object.keys(parameters.options[cat])" :key="lang" #[`lang.${lang}`]>
              <options-list
                numeric
                :options="parameters.options[cat][lang]"
                :readonly
                :rules
                @update:options="updateOption(cat, lang, $event)"
              />
            </template>
          </language-selector>
          <v-btn
            v-if="!readonly"
            class="align-self-end"
            color="error"
            :disabled="cat === '_default'"
            variant="text"
            @click="removeCategory(cat)"
          >
            <v-icon icon="$delete" start />{{ $t(`fdbs.categories.remove`) }}
          </v-btn>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref } from 'vue';
import { SelectResource } from '@intake24/admin/components/dialogs';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { OptionsList } from '@intake24/admin/components/lists';
import type { PortionSizeParameters } from '@intake24/common/surveys';
import type { ListOption } from '@intake24/common/types';
import { useParameters } from './use-parameters';

defineOptions({ name: 'ParentFoodPortionParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['parent-food-portion']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'parent-food-portion'>(props, { emit });

const selected = ref(Object.keys(parameters.value.options).at(0));

const rules = [
  (value: any): boolean | string => {
    const msg = 'Value must be greater than 0';
    const number = Number.parseFloat(value);
    if (Number.isNaN(number))
      return msg;

    return number > 0 || msg;
  },
];

function addCategory(category: string) {
  parameters.value.options = { ...parameters.value.options, [category]: { en: [] } };
}

function removeCategory(category: string) {
  if (category === '_default')
    return;

  const { [category]: _, ...rest } = parameters.value.options;
  parameters.value.options = rest;
}

function updateOption(cat: string, lang: string, value: ListOption[]) {
  parameters.value.options[cat][lang] = [
    ...value.map(item => ({
      ...item,
      value: Number.parseFloat(item.value),
    })),
  ];
}
</script>
