<template>
  <v-tabs-window-item value="options">
    <v-row class="mb-2">
      <v-col cols="12">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.other')"
          :model-value="other"
          @update:model-value="update('other', $event)"
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

<script lang="ts">
import type { PropType } from 'vue';

import type { ActionItem, Prompts } from '@intake24/common/prompts';
import type { ListOption } from '@intake24/common/types';

import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { updateFoodCodePlaceholder, updateFoodSubsetKey } from '@intake24/common/prompts';
import { ConfirmDialog } from '@intake24/ui';

import { selectListPrompt } from '../partials';

export default defineComponent({
  name: 'CheckboxListPrompt',

  components: { ConfirmDialog, SelectResource },

  mixins: [selectListPrompt],

  props: {
    updateFoodActions: {
      type: Object as PropType<Prompts['checkbox-list-prompt']['updateFoodActions']>,
      required: true,
    },
  },

  data() {
    return {
      hasInitializedUpdateFoodOptions: false,
      subsetsStale: false,
      disableUpdateFoodActionsDialog: false,
      showUpdateFoodActions: Object.values(this.updateFoodActions ?? {}).some(actions => Object.keys(actions).length > 0),
      currentSubsetActions: {} as Record<string, Record<string, { label: string; action?: ActionItem }>>,
    };
  },

  computed: {
    optionsFingerprint(): string {
      return JSON.stringify(
        Object.entries(this.options ?? {})
          .sort(([langA], [langB]) => langA.localeCompare(langB))
          .map(([lang, options]) => [
            lang,
            (options ?? []).map(option => ({
              value: option.value ?? null,
              label: option.label,
              exclusive: !!option.exclusive,
            })),
          ]),
      );
    },
  },

  watch: {
    optionsFingerprint: {
      immediate: true,
      handler() {
        if (!this.hasInitializedUpdateFoodOptions) {
          this.currentSubsetActions = this.buildCurrentSubsetActions();
          this.hasInitializedUpdateFoodOptions = true;
          this.subsetsStale = false;
          return;
        }

        this.subsetsStale = true;
      },
    },
    currentSubsetActions: {
      deep: true,
      handler() {
        this.update('updateFoodActions', this.buildUpdateFoodActionsPatch());
      },
    },
  },

  methods: {
    toggleUpdateFoodActions(enable: boolean | null) {
      if (enable) {
        this.showUpdateFoodActions = true;
        return;
      }

      this.disableUpdateFoodActionsDialog = true;
    },
    confirmDisableUpdateFoodActions() {
      for (const subsets of Object.values(this.currentSubsetActions)) {
        for (const subset of Object.values(subsets))
          subset.action = undefined;
      }

      this.showUpdateFoodActions = false;
    },
    buildUpdateFoodActionsPatch() {
      const patch: Record<string, Record<string, ActionItem | undefined> | undefined> = {};

      for (const [lang, subsets] of Object.entries(this.currentSubsetActions)) {
        const orphanedKeys = Object.keys(this.updateFoodActions?.[lang] ?? {})
          .filter(subsetKey => !(subsetKey in subsets));

        patch[lang] = {
          ...Object.fromEntries(orphanedKeys.map(subsetKey => [subsetKey, undefined])),
          ...Object.fromEntries(
            Object.entries(subsets).map(([subsetKey, value]) => [subsetKey, value.action]),
          ),
        };
      }

      for (const lang of Object.keys(this.updateFoodActions ?? {})) {
        if (!(lang in patch))
          patch[lang] = undefined;
      }

      return patch;
    },
    buildCurrentSubsetActions() {
      const next: Record<string, Record<string, { label: string; action?: ActionItem }>> = {};

      for (const [lang, options] of Object.entries(this.options ?? {})) {
        const subsets = this.updateSubsets(options);
        const existingActions = this.updateFoodActions?.[lang] ?? this.updateFoodActions?.en ?? {};

        next[lang] = Object.fromEntries(subsets.map(subset => [
          subset.key,
          {
            label: subset.label,
            action: existingActions[subset.key],
          },
        ]));
      }

      return next;
    },
    handleClick() {
      this.currentSubsetActions = this.buildCurrentSubsetActions();
      this.subsetsStale = false;
    },
    changeSubsetAction(lang: string, subsetKey: string, enable: boolean | null) {
      const currentByLanguage = this.currentSubsetActions[lang] ?? {};
      const currentEntry = currentByLanguage[subsetKey];
      const action = enable ? { type: 'updateFood' as const, params: { code: updateFoodCodePlaceholder } } : undefined;

      this.currentSubsetActions = {
        ...this.currentSubsetActions,
        [lang]: {
          ...currentByLanguage,
          [subsetKey]: {
            ...currentEntry,
            action,
          },
        },
      };
    },
    updateSubsetFoodCode(lang: string, subsetKey: string, foodcode: string | null) {
      const entry = this.currentSubsetActions[lang][subsetKey];
      entry.action!.params.code = foodcode ?? '';
    },
    updateSubsets(options: ListOption[]): { key: string; label: string }[] {
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
    },
  },
});
</script>

<style lang="scss" scoped></style>
