<template>
  <v-tabs-window-item value="options">
    <v-row class="ml-2" density="compact">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.yes-no-prompt.useFlag')"
          :model-value="useFlag"
          @update:model-value="update('useFlag', $event)"
        />
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-show="useFlag" class="ml-2" density="compact">
        <v-col cols="12" md="6">
          <v-text-field :label="$t('survey-schemes.prompts.yes-no-prompt.flag')" :model-value="flag" @update:model-value="update('flag', $event)" />
        </v-col>
      </v-row>
    </v-expand-transition>
    <v-row class="ml-2" density="compact">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.yes-no-prompt.trueActionToggle')"
          :model-value="!!trueAction"
          @update:model-value="changeToggle(true, $event)"
        />
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-if="currentTrueAction" class="ml-2" density="compact">
        <v-col cols="12" md="6">
          <v-select
            v-model="currentTrueAction.type"
            hide-details="auto"
            :items="availableActions"
            :label="$t('survey-schemes.prompts.yes-no-prompt.actionType')"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <select-resource
            v-model="currentTrueAction.params.code"
            item-id="code"
            :label="$t('common.options.action.foodCode')"
            resource="foods"
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
    </v-expand-transition>
    <v-row class="ml-2" density="compact">
      <v-col cols="12" md="6">
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.yes-no-prompt.falseActionToggle')"
          :model-value="!!falseAction"
          @update:model-value="changeToggle(false, $event)"
        />
      </v-col>
    </v-row>
    <v-expand-transition>
      <v-row v-if="currentFalseAction" class="ml-2" density="compact">
        <v-col cols="12" md="6">
          <v-select
            v-model="currentFalseAction.type"
            hide-details="auto"
            :items="availableActions"
            :label="$t('survey-schemes.prompts.yes-no-prompt.actionType')"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <select-resource
            v-model="currentFalseAction.params.code"
            item-id="code"
            :label="$t('common.options.action.foodCode')"
            resource="foods"
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
    </v-expand-transition>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { Prompts } from '@intake24/common/prompts';

import { defineComponent, ref, watch } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';

import { basePrompt } from '../partials';

export default defineComponent({
  name: 'YesNoPrompt',

  components: {
    SelectResource,
  },

  mixins: [basePrompt],

  props: {
    useFlag: {
      type: Boolean as PropType<Prompts['yes-no-prompt']['useFlag']>,
      required: true,
    },
    flag: {
      type: String as PropType<Prompts['yes-no-prompt']['flag']>,
      required: false,
    },
    trueAction: {
      type: Object as PropType<Prompts['yes-no-prompt']['trueAction']>,
      required: false,
    },
    falseAction: {
      type: Object as PropType<Prompts['yes-no-prompt']['falseAction']>,
      required: false,
    },
  },

  emits: ['update:options'],

  setup(props, { emit }) {
    const availableActions = [{ value: 'updateFood', title: 'Update Food' }];
    const currentTrueAction = ref(props.trueAction ? { ...props.trueAction } : undefined);
    const currentFalseAction = ref(props.falseAction ? { ...props.falseAction } : undefined);

    function changeToggle(type: boolean, enable: boolean | null) {
      if (type)
        currentTrueAction.value = enable ? { type: 'updateFood', params: { code: 'FOOD_CODE' } } : undefined;
      else
        currentFalseAction.value = enable ? { type: 'updateFood', params: { code: 'FOOD_CODE' } } : undefined;
    };

    watch(
      currentTrueAction,
      (value) => {
        emit('update:options', { trueAction: value });
      },
      { deep: true },
    );

    watch(
      currentFalseAction,
      (value) => {
        emit('update:options', { falseAction: value });
      },
      { deep: true },
    );

    return {
      availableActions,
      currentTrueAction,
      currentFalseAction,
      changeToggle,
    };
  },
});
</script>

<style lang="scss" scoped></style>
