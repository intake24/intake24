<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-2">
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.other')"
          :model-value="other"
          @update:model-value="update('other', !!$event)"
        />
      </v-col>
    </v-row>
    <language-selector
      border
      :default="[]"
      :label="$t('common.options.title')"
      :model-value="options"
      :required="true"
      @update:model-value="update('options', $event)"
    >
      <template v-for="lang in Object.keys(options)" :key="lang" #[`lang.${lang}`]>
        <options-list
          exclusive
          :options="options[lang]"
          :show-update-food-action="false"
          @update:options="updateLanguage('options', lang, $event)"
        />

        <v-switch
          class="mt-3"
          density="compact"
          hide-details="auto"
          :label="$t('survey-schemes.prompts.checkbox-list-prompt.toggleUpdateFood')"
          :model-value="showUpdateFoodActions"
          @update:model-value="toggleUpdateFoodActions"
        />
        <v-row v-if="showUpdateFoodActions" class="mt-3">
          <v-col cols="12">
            <v-btn
              class="my-4 ignore-item"
              color="primary"
              :disabled="!subsetsStale"
              @click="handleClick"
            >
              {{ $t('survey-schemes.prompts.checkbox-list-prompt.refreshSubsets') }}
            </v-btn>
          </v-col>
          <v-col
            v-for="[key, value] in Object.entries(currentSubsetActions[lang] ?? {})"
            :key="`${lang}-${key}`"
            cols="12"
          >
            <v-switch
              :disabled="subsetsStale"
              hide-details="auto"
              :label="value.label"
              :model-value="!!value.action"
              @update:model-value="changeSubsetAction(lang, key, $event)"
            />
            <select-resource
              v-if="value.action"
              :disabled="subsetsStale"
              item-id="code"
              :label="$t('common.options.action.foodCode')"
              :model-value="value.action.params.code"
              resource="foods"
              @update:model-value="updateSubsetFoodCode(lang, key, $event)"
            >
              <template #title>
                {{ $t('fdbs.foods.title') }}
              </template>
              <template #item="{ item }">
                <v-list-item-title>{{ item.code }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
              </template>
            </select-resource>
          </v-col>
        </v-row>
      </template>
    </language-selector>
    <confirm-dialog
      v-model="disableUpdateFoodActionsDialog"
      color="error"
      external
      :label="$t('survey-schemes.prompts.checkbox-list-prompt.disableUpdateFoodActions')"
      @confirm="confirmDisableUpdateFoodActions"
    >
      {{ $t('survey-schemes.prompts.checkbox-list-prompt.disableUpdateFoodActionsWarning') }}
    </confirm-dialog>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { ActionItem, Prompts } from '@intake24/common/prompts';
import type { ListOption } from '@intake24/common/types';

import { computed, ref, watch } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { OptionsList } from '@intake24/admin/components/lists';
import { updateFoodCodePlaceholder, updateFoodSubsetKey } from '@intake24/common/prompts';
import { ConfirmDialog } from '@intake24/ui';

import { selectListProps, useBasePrompt } from '../partials';

defineOptions({ name: 'CheckboxListPrompt' });

const props = defineProps({
  ...selectListProps,
  updateFoodActions: {
    type: Object as PropType<Prompts['checkbox-list-prompt']['updateFoodActions']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update, updateLanguage } = useBasePrompt(props, { emit });
const hasInitializedUpdateFoodOptions = ref(false);
const subsetsStale = ref(false);
const disableUpdateFoodActionsDialog = ref(false);
const showUpdateFoodActions = ref(Object.values(props.updateFoodActions ?? {}).some(actions => Object.keys(actions).length > 0));
const currentSubsetActions = ref<Record<string, Record<string, { label: string; action?: ActionItem }>>>({});

const optionsFingerprint = computed(() =>
  JSON.stringify(
    Object.entries(props.options ?? {})
      .sort(([langA], [langB]) => langA.localeCompare(langB))
      .map(([lang, options]) => [
        lang,
        (options ?? []).map(option => ({
          value: option.value ?? null,
          label: option.label,
          exclusive: !!option.exclusive,
        })),
      ]),
  ),
);

watch(optionsFingerprint, () => {
  if (!hasInitializedUpdateFoodOptions.value) {
    currentSubsetActions.value = buildCurrentSubsetActions();
    hasInitializedUpdateFoodOptions.value = true;
    subsetsStale.value = false;
    return;
  }

  subsetsStale.value = true;
}, { immediate: true });

watch(
  currentSubsetActions,
  () => {
    emit('update:options', {
      updateFoodActions: buildUpdateFoodActionsPatch(),
    });
  },
  { deep: true },
);

function toggleUpdateFoodActions(enable: boolean | null) {
  if (enable) {
    showUpdateFoodActions.value = true;
    return;
  }

  disableUpdateFoodActionsDialog.value = true;
}

function confirmDisableUpdateFoodActions() {
  for (const subsets of Object.values(currentSubsetActions.value)) {
    for (const subset of Object.values(subsets))
      subset.action = undefined;
  }

  showUpdateFoodActions.value = false;
}

function buildUpdateFoodActionsPatch() {
  const patch: Record<string, Record<string, ActionItem | undefined> | undefined> = {};

  for (const [lang, subsets] of Object.entries(currentSubsetActions.value)) {
    const orphanedKeys = Object.keys(props.updateFoodActions?.[lang] ?? {})
      .filter(subsetKey => !(subsetKey in subsets));

    patch[lang] = {
      ...Object.fromEntries(orphanedKeys.map(subsetKey => [subsetKey, undefined])),
      ...Object.fromEntries(
        Object.entries(subsets).map(([subsetKey, value]) => [subsetKey, value.action]),
      ),
    };
  }

  for (const lang of Object.keys(props.updateFoodActions ?? {})) {
    if (!(lang in patch))
      patch[lang] = undefined;
  }

  return patch;
}

function buildCurrentSubsetActions() {
  const next: Record<string, Record<string, { label: string; action?: ActionItem }>> = {};

  for (const [lang, options] of Object.entries(props.options ?? {})) {
    const subsets = updateSubsets(options);
    const existingActions = props.updateFoodActions?.[lang] ?? props.updateFoodActions?.en ?? {};

    next[lang] = Object.fromEntries(subsets.map(subset => [
      subset.key,
      {
        label: subset.label,
        action: existingActions[subset.key],
      },
    ]));
  }

  return next;
}

function handleClick() {
  currentSubsetActions.value = buildCurrentSubsetActions();
  subsetsStale.value = false;
}

function changeSubsetAction(lang: string, subsetKey: string, enable: boolean | null) {
  const currentByLanguage = currentSubsetActions.value[lang] ?? {};
  const currentEntry = currentByLanguage[subsetKey];
  const action = enable
    ? {
        type: 'updateFood' as const,
        params: { code: updateFoodCodePlaceholder },
      }
    : undefined;

  currentSubsetActions.value = {
    ...currentSubsetActions.value,
    [lang]: {
      ...currentByLanguage,
      [subsetKey]: {
        ...currentEntry,
        action,
      },
    },
  };
}

function updateSubsetFoodCode(lang: string, subsetKey: string, foodcode: string | null) {
  const entry = currentSubsetActions.value[lang][subsetKey];
  entry.action!.params.code = foodcode ?? '';
}

function updateSubsets(options: ListOption[]): { key: string; label: string }[] {
  const subsets: { key: string; label: string }[] = [];

  for (let mask = 1; mask < (2 ** options.length); mask++) {
    const selected: ListOption[] = [];
    for (let i = 0; i < options.length; i++) {
      if ((mask & (1 << i)) !== 0)
        selected.push(options[i]);
    }

    if (selected.length > 1 && selected.some(option => option.exclusive))
      continue;

    subsets.push({
      key: updateFoodSubsetKey(selected.map(option => option.value)),
      label: selected.map(option => option.label).join(', '),
    });
  }

  return subsets;
}
</script>

<style lang="scss" scoped></style>
