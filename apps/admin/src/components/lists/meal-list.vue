<template>
  <v-card flat tile>
    <v-toolbar color="grey-lighten-2">
      <v-icon color="secondary" end icon="fas fa-hamburger" />
      <div class="d-flex flex-column ms-4">
        <v-toolbar-title class="font-weight-medium">
          {{ title }}
        </v-toolbar-title>
        <span v-if="subtitle" class="text-subtitle-2">{{ subtitle }}</span>
      </div>
      <v-spacer />
      <v-btn color="primary" icon="$add" size="small" :title="$t('survey-schemes.meals.create')" @click.stop="add" />
      <confirm-dialog
        color="error"
        :label="$t('survey-schemes.meals.reset._')"
        @confirm="resetList"
      >
        <template #activator="{ props }">
          <v-btn
            class="ml-3"
            color="error"
            icon="$sync"
            size="small"
            :title="$t('survey-schemes.meals.reset._')"
            v-bind="props"
          />
        </template>
        {{ $t('survey-schemes.meals.reset.text') }}
      </confirm-dialog>
      <options-menu>
        <select-resource resource="survey-schemes" return-object="meals" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('survey-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="meals" />
      </options-menu>
    </v-toolbar>
    <v-list class="list-border" lines="two">
      <vue-draggable
        v-model="meals"
        :animation="300"
        handle=".drag-and-drop__handle"
      >
        <v-list-item
          v-for="(meal, index) in meals"
          :key="meal.name.en"
          :class="errors.has(`meals.${index}.*`) ? 'text-error' : undefined"
          :variant="errors.has(`meals.${index}.*`) ? 'tonal' : undefined"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title>{{ meal.name.en }}</v-list-item-title>
          <v-list-item-subtitle>{{ meal.time }}</v-list-item-subtitle>
          <template #append>
            <list-item-error :errors="errors.get(`meals.${index}.*`)" />
            <v-list-item-action>
              <v-btn icon="$edit" :title="$t('survey-schemes.meals.edit')" @click.stop="edit(index, meal)" />
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('survey-schemes.meals.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: meal.name.en }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <v-dialog
      v-model="dialog.show"
      fullscreen
      no-click-animation
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card tile>
        <v-toolbar color="secondary">
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
          <v-toolbar-title>
            {{ $t(`survey-schemes.meals.${dialog.index === -1 ? 'create' : 'edit'}`) }}
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-toolbar-items>
          <template #extension>
            <v-container fluid>
              <v-tabs v-model="tab" bg-color="secondary">
                <v-tab v-for="item in ['general', 'json']" :key="item" :value="item">
                  {{ item }}
                </v-tab>
              </v-tabs>
            </v-container>
          </template>
        </v-toolbar>
        <v-form ref="form" @submit.prevent="save">
          <v-container class="dialog-container" fluid>
            <error-list :errors="errors.get(`meals.${dialog.index}.*`)" />
            <v-tabs-window v-model="tab" class="pt-1 flex-grow-1">
              <v-tabs-window-item value="general">
                <v-row>
                  <v-col cols="12" md="6">
                    <language-selector
                      v-model="dialog.meal.name"
                      border
                      :label="$t('survey-schemes.meals.name')"
                    >
                      <template v-for="lang in Object.keys(dialog.meal.name)" :key="lang" #[`lang.${lang}`]>
                        <v-text-field
                          v-model="dialog.meal.name[lang]"
                          hide-details="auto"
                          :label="$t('survey-schemes.meals.name')"
                          :rules="rules(lang)"
                          variant="outlined"
                        />
                      </template>
                    </language-selector>
                  </v-col>
                  <v-col cols="12" md="6">
                    <custom-list
                      v-model="dialog.meal.flags"
                      border
                      flat
                      :item="$t('survey-schemes.meals.flag')"
                      :standard-items="staticMealFlags"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card border class="w-100" flat>
                      <v-toolbar color="grey-lighten-4">
                        <v-icon color="secondary" end icon="fas fa-clock" />
                        <v-toolbar-title class="font-weight-medium">
                          {{ $t('survey-schemes.meals.defaultTime') }}
                        </v-toolbar-title>
                      </v-toolbar>
                      <v-card-text class="pt-0 d-flex justify-center">
                        <v-time-picker
                          v-model="dialog.meal.time"
                          class="time-picker pa-0"
                          :landscape="$vuetify.display.smAndUp"
                        />
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-tabs-window-item>
              <v-tabs-window-item value="json">
                <json-editor v-model="dialog.meal" />
              </v-tabs-window-item>
            </v-tabs-window>
            <v-card-actions>
              <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
                <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
              </v-btn>
              <v-spacer />
              <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
                <v-icon icon="$success" start />{{ $t('common.action.ok') }}
              </v-btn>
            </v-card-actions>
          </v-container>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { ListItemError } from '@intake24/admin/components/lists';
import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { Meal } from '@intake24/common/surveys';
import { defaultMeals, staticMealFlags } from '@intake24/common/surveys';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui';
import { OptionsMenu, SelectResource } from '../dialogs';
import { JsonEditor, JsonEditorDialog } from '../editors';
import { ErrorList, LanguageSelector } from '../forms';
import CustomList from './custom-list.vue';

type MealDialog = {
  show: boolean;
  index: number;
  meal: Meal;
};

defineOptions({ name: 'MealList' });

const props = defineProps({
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  schemeId: {
    type: String,
    required: true,
  },
  mode: {
    type: String as PropType<'full' | 'override'>,
    default: 'full',
  },
  modelValue: {
    type: Array as PropType<Meal[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

function newDialog(show = false): MealDialog {
  return {
    show,
    index: -1,
    meal: { name: { en: '' }, time: '8:00', flags: [] },
  };
}

const dialog = ref(newDialog());
const form = useTemplateRef('form');
const meals = useVModel(props, 'modelValue', emit, { passive: true, deep: true, clone: copy });
const tab = ref('general');

const isOverrideMode = computed(() => props.mode === 'override');
const title = computed(() => t(
  isOverrideMode.value ? 'survey-schemes.overrides.meals.title' : 'survey-schemes.meals.title',
));
const subtitle = computed(() => isOverrideMode.value ? t('survey-schemes.overrides.meals.subtitle') : undefined);

function rules(langId: string) {
  return [
    (value: string | null): boolean | string => {
      if (!value)
        return t('survey-schemes.meals.validation.required');

      const { index } = dialog.value;
      const match = meals.value.find(
        (meal, idx) => value === meal.name[langId] && index !== idx,
      );

      return match ? t('survey-schemes.meals.validation.unique') : true;
    },
  ];
};

function clearErrors(index?: number) {
  props.errors.clear(typeof index === 'undefined' ? 'meals.*' : `meals.${index}.*`);
}

function add() {
  dialog.value = newDialog(true);
};

function edit(index: number, meal: Meal) {
  dialog.value = { show: true, index, meal: copy(meal) };
};

async function save() {
  const { valid } = await form.value?.validate() ?? {};
  if (!valid)
    return;

  const { index, meal } = dialog.value;

  if (index === -1)
    meals.value.push(meal);
  else meals.value.splice(index, 1, meal);

  clearErrors(index);
  reset();
};

function remove(index: number) {
  clearErrors(index);
  meals.value.splice(index, 1);
};

function reset() {
  dialog.value = newDialog();
  form.value?.resetValidation();
};

function load(items: Meal[]) {
  clearErrors();
  meals.value = [...items];
};

function resetList() {
  clearErrors();
  meals.value = copy(defaultMeals);
};
</script>

<style lang="scss">

</style>
