<template>
  <layout
    v-if="entryLoaded && refsLoaded"
    v-bind="{ id, entry }"
    v-model:route-leave="routeLeave"
    @save="submit"
  >
    <template #actions>
      <preview :feedback-scheme="currentFeedbackScheme" :images="refs?.images" />
    </template>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end>
        fas fa-sort-amount-down
      </v-icon>
      <v-toolbar-title class="font-weight-medium">
        {{ $t('feedback-schemes.meals.title') }}
      </v-toolbar-title>
      <v-spacer />
      <options-menu>
        <select-resource resource="feedback-schemes" return-object="meals" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('feedback-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="data.meals" />
      </options-menu>
    </v-toolbar>

    <v-form @keydown="clearError" @submit.prevent="submit">
      <v-toolbar color="grey-lighten-4">
        <v-icon color="secondary" end>
          fas fa-chart-pie
        </v-icon>
        <v-toolbar-title class="font-weight-medium">
          {{ $t('feedback-schemes.meals.chart') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="6">
            <v-toolbar color="grey-lighten-2">
              <v-icon color="secondary" end>
                fas fa-palette
              </v-icon>
              <v-toolbar-title class="font-weight-medium">
                {{ $t('feedback-schemes.meals.colors.title') }}
              </v-toolbar-title>
              <v-spacer />
              <v-text-field
                v-model.number="colorMax"
                bg-color="grey lighten-5"
                density="compact"
                hide-details
                :label="$t('feedback-schemes.meals.colors._')"
                name="colorMax"
                :rules="maxRules"
                single-line
                :style="{ maxWidth: '75px' }"
                variant="outlined"
              />
            </v-toolbar>
            <error-list :errors="nonInputErrors" />
            <color-list v-model="data.meals.chart.colors" />
          </v-col>
          <v-divider vertical />
          <v-col cols="12" md="6">
            <nutrient-list
              v-model="data.meals.chart.nutrients"
              :defaults="defaultMeals.chart.nutrients"
              :nutrient-types="refs.nutrientTypes"
            />
          </v-col>
        </v-row>
      </v-container>
      <table-field-list
        v-model="data.meals.table.fields"
        :defaults="defaultMeals.table.fields"
        :nutrient-types="refs.nutrientTypes"
      />
      <v-card-text>
        <submit-footer :disabled="errors.any.value" />
      </v-card-text>
    </v-form>
  </layout>
</template>

<script lang="ts">
import type { FeedbackSchemeForm } from '../form.vue';
import { debounce } from 'lodash-es';

import { computed, defineComponent, ref, watch } from 'vue';
import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { formMixin } from '@intake24/admin/components/entry';
import { Preview, TableFieldList } from '@intake24/admin/components/feedback';
import { ColorList, NutrientList } from '@intake24/admin/components/lists';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import type { RuleCallback } from '@intake24/admin/types';
import type { FeedbackMeals } from '@intake24/common/feedback';
import { defaultMeals } from '@intake24/common/feedback';
import { colors } from '@intake24/common/theme';
import type { FeedbackSchemeEntry, FeedbackSchemeRefs } from '@intake24/common/types/http/admin';

import { useI18n } from '@intake24/ui';

export type FeedbackSchemeMealsForm = Pick<FeedbackSchemeForm, 'meals'>;

export default defineComponent({
  name: 'FeedbackSchemeMeals',

  components: {
    ColorList,
    JsonEditorDialog,
    NutrientList,
    OptionsMenu,
    Preview,
    SelectResource,
    TableFieldList,
  },

  mixins: [formMixin],

  setup(props) {
    const menu = ref(false);
    const colorMax = ref(6);

    const { i18n } = useI18n();

    const { entry, entryLoaded, refs, refsLoaded } = useEntry<
      FeedbackSchemeEntry,
      FeedbackSchemeRefs
    >(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, nonInputErrors, routeLeave, submit } = useEntryForm<
      FeedbackSchemeMealsForm,
      FeedbackSchemeEntry
    >(props, {
      data: { meals: defaultMeals },
      editMethod: 'patch',
      nonInputErrorKeys: ['meals.chart', 'meals.table'],
    });

    const maxRules = computed<RuleCallback[]>(() => [
      (value: string | null): boolean | string =>
        Number.isInteger(value) || i18n.t('feedback-schemes.colors.max.required'),
    ]);

    const currentFeedbackScheme = computed(() => ({ ...entry.value, ...data.value }));

    const updateColorList = () => {
      if (colorMax.value < data.value.meals.chart.colors.length) {
        data.value.meals.chart.colors = [...data.value.meals.chart.colors.slice(0, colorMax.value)];
      }
      else if (colorMax.value > data.value.meals.chart.colors.length) {
        const newColors = Array.from<string>({
          length: colorMax.value - data.value.meals.chart.colors.length,
        }).fill(colors.primary);

        data.value.meals.chart.colors = [...data.value.meals.chart.colors, ...newColors];
      }
    };

    const load = (meals: FeedbackMeals) => {
      data.value.meals = { ...meals };
    };

    const debouncedUpdateColorList = debounce(() => {
      updateColorList();
    }, 300);

    watch(colorMax, () => {
      debouncedUpdateColorList();
    });

    return {
      colorMax,
      defaultMeals,
      entry,
      entryLoaded,
      refs,
      refsLoaded,
      clearError,
      data,
      errors,
      menu,
      nonInputErrors,
      routeLeave,
      submit,
      maxRules,
      currentFeedbackScheme,
      load,
    };
  },
});
</script>

<style lang="scss" scoped></style>
