<template>
  <v-toolbar color="grey-lighten-4">
    <v-toolbar-title class="font-weight-medium">
      {{ $t('locales.food-builders.title') }}
    </v-toolbar-title>
    <v-spacer />
    <v-btn
      color="secondary"
      icon="$add"
      size="small"
      :title="$t('locales.food-builders.add')"
      @click.stop="add"
    />
  </v-toolbar>
  <v-list class="list-border" lines="two">
    <v-list-item
      v-for="(item, index) in items" :key="item.id"
      :class="errors.has(`${index}.*`) ? 'text-error' : undefined"
      :variant="errors.has(`${index}.*`) ? 'tonal' : undefined"
    >
      <template #prepend>
        <v-icon>fas fa-blender</v-icon>
      </template>
      <v-list-item-title class="font-weight-medium">
        {{ item.code }} | {{ item.name }}
      </v-list-item-title>
      <template #append>
        <list-item-error :errors="errors.get(`${index}.*`)" />
        <v-list-item-action>
          <v-btn
            icon
            :title="$t('locales.food-builders.edit')"
            @click.stop="edit(index, item)"
          >
            <v-icon color="secondary-lighten-2">
              $edit
            </v-icon>
          </v-btn>
        </v-list-item-action>
        <v-list-item-action>
          <confirm-dialog
            color="error"
            icon
            icon-left="$delete"
            :label="$t('locales.food-builders.remove')"
            @confirm="remove(index)"
          >
            {{ $t('common.action.confirm.delete', { name: item.triggerWord }) }}
          </confirm-dialog>
        </v-list-item-action>
      </template>
    </v-list-item>
  </v-list>
  <v-dialog
    v-model="dialog.show"
    fullscreen
    persistent
    :retain-focus="false"
    :scrim="false"
    transition="dialog-bottom-transition"
    :z-index="1050"
  >
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
        <v-toolbar-title>
          <v-icon icon="fas fas fa-blender" start />
          {{
            $t(`locales.food-builders.${dialog.index === -1 ? 'add' : 'edit'}`)
          }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
            <v-icon icon="$success" start />{{ $t('common.action.ok') }}
          </v-btn>
        </v-toolbar-items>
        <template #extension>
          <v-container>
            <v-tabs v-model="tab" bg-color="secondary">
              <v-tab v-for="item in ['general', 'steps', 'json']" :key="item" :value="item">
                {{ $t(`locales.food-builders.tabs.${item}`) }}
              </v-tab>
            </v-tabs>
          </v-container>
        </template>
      </v-toolbar>
      <v-form ref="form" @keydown="clearError" @submit.prevent="save">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="general">
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="dialog.item.type"
                    :error-messages="errors.get(`${dialog.index}.type`)"
                    :items="types"
                    :label="$t('locales.food-builders.types._')"
                    :name="`${dialog.index}.type`"
                    @update:model-value="errors.clear(`${dialog.index}.type`)"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.trim="dialog.item.triggerWord"
                    :error-messages="errors.get(`${dialog.index}.triggerWord`)"
                    :label="$t('locales.food-builders.triggerWord')"
                    :name="`${dialog.index}.triggerWord`"
                    prepend-inner-icon="fas fa-magnifying-glass"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.trim="dialog.item.name"
                    :error-messages="errors.get(`${dialog.index}.name`)"
                    :label="$t('locales.food-builders.name')"
                    :name="`${dialog.index}.name`"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.trim="dialog.item.code"
                    :error-messages="errors.get(`${dialog.index}.code`)"
                    :label="$t('locales.food-builders.code')"
                    :name="`${dialog.index}.code`"
                    prepend-inner-icon="fa-sharp fa-regular fa-dollar-sign"
                  />
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="dialog.item.synonymSetId"
                    :error-messages="errors.get(`${dialog.index}.synonymSetId`)"
                    item-title="synonyms"
                    item-value="id"
                    :items="synonyms"
                    :label="$t('locales.food-builders.synonymSetId')"
                    :name="`${dialog.index}.synonymSetId`"
                    @update:model-value="errors.clear(`${dialog.index}.synonymSetId`)"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-tabs-window-item>
          <v-tabs-window-item value="steps">
            <v-container>
              <v-expansion-panels class="d-block">
                <vue-draggable
                  v-model="dialog.item.steps"
                  :animation="300"
                  handle=".drag-and-drop__handle"
                >
                  <v-expansion-panel v-for="(step, index) in dialog.item.steps" :key="step.id">
                    <v-expansion-panel-title class="text-h4 font-weight-medium mb-2">
                      <v-avatar class="drag-and-drop__handle me-2" color="primary" size="36">
                        <span class="text-white font-weight-medium text-h6">{{ index + 1 }}</span>
                      </v-avatar>
                      {{ translate(step.name) }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="d-flex flex-column gr-4">
                        <v-select
                          v-model="step.type"
                          :error-messages="errors.get(`${dialog.index}.type`)"
                          :items="stepTypes"
                          :label="$t('locales.food-builders.steps.types._')"
                          :name="`${dialog.index}.type`"
                          @update:model-value="updateStepType(index)"
                        />
                        <language-selector
                          v-model="step.name"
                          border
                          :label="$t('locales.food-builders.steps.name')"
                          required
                        >
                          <template v-for="lang in Object.keys(step.name)" :key="lang" #[`lang.${lang}`]>
                            <v-text-field
                              v-model="step.name[lang]"
                              :error-messages="errors.get(`${dialog.index}.steps.${index}.name`)"
                              :name="`${dialog.index}.steps.${index}.name.${lang}`"
                              @update:model-value="errors.clear(`${dialog.index}.steps.${index}.name`)"
                            />
                          </template>
                        </language-selector>
                        <language-selector
                          v-model="step.description"
                          border
                          :label="$t('locales.food-builders.steps.description')"
                          required
                        >
                          <template v-for="lang in Object.keys(step.description)" :key="lang" #[`lang.${lang}`]>
                            <v-text-field
                              v-model="step.description[lang]"
                              :error-messages="errors.get(`${dialog.index}.steps.${index}.description`)"
                              :name="`${dialog.index}.steps.${index}.description.${lang}`"
                              @update:model-value="errors.clear(`${dialog.index}.steps.${index}.description`)"
                            />
                          </template>
                        </language-selector>
                        <component
                          :is="step.type"
                          v-bind="{ localeId, errors, index: dialog.index, stepIndex: index }"
                          v-model="dialog.item.steps[index]"
                        />
                        <confirm-dialog
                          block
                          color="error"
                          icon-left="$delete"
                          :label="$t('locales.food-builders.steps.remove')"
                          :title="$t('locales.food-builders.steps.remove')"
                          @confirm="removeStep(index)"
                        >
                          {{ $t('common.action.confirm.remove', { name: translate(step.name) }) }}
                        </confirm-dialog>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </vue-draggable>
              </v-expansion-panels>
              <v-fab
                class="step-add"
                color="primary"
                icon="$add"
                :title="$t('locales.food-builders.steps.add')"
                @click.stop="addStep"
              />
            </v-container>
          </v-tabs-window-item>
          <v-tabs-window-item value="json">
            <v-container>
              <json-editor v-model="dialog.item" />
            </v-container>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { FoodBuilderRequest, SynonymSetAttributes } from '@intake24/common/types/http/admin';

import { computed, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { useListWithDialog } from '@intake24/admin/composables';
import { foodBuilderTypes, foodStepTypes } from '@intake24/common/types/http/admin';
import { copy, randomString } from '@intake24/common/util';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import { JsonEditor } from '../editors';
import { LanguageSelector } from '../forms';
import { ListItemError } from '../lists';
import { stepDefaults, steps } from './steps';

defineOptions({
  components: { ...steps },
});

const props = defineProps({
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  localeId: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Array as PropType<FoodBuilderRequest[]>,
    required: true,
  },
  synonyms: {
    type: Array as PropType<SynonymSetAttributes[]>,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n, translate } = useI18n();

function newItem(): FoodBuilderRequest {
  return {
    localeId: props.localeId,
    code: '',
    type: 'recipe',
    name: '',
    triggerWord: '',
    synonymSetId: null,
    steps: [],
  };
}

const { dialog, form, items, add, edit, remove, reset: resetItem, save }
  = useListWithDialog(props, { emit }, { newItem });

const tab = ref('general');

const types = computed(() =>
  foodBuilderTypes.map(value => ({
    title: i18n.t(`locales.food-builders.types.${value}`),
    value,
  })),
);

const stepTypes = computed(() =>
  foodStepTypes.map(value => ({
    title: i18n.t(`locales.food-builders.steps.types.${value}`),
    value,
  })),
);

function clearError(event: KeyboardEvent) {
  const { name } = event.target as HTMLInputElement;

  if (name)
    props.errors.clear(name);
}

function reset() {
  tab.value = 'general';
  resetItem();
}

function addStep() {
  dialog.value.item.steps.push({ ...stepDefaults.ingredient, id: randomString(6) });
}

function removeStep(index: number) {
  dialog.value.item.steps.splice(index, 1);
}

function updateStepType(stepIndex: number) {
  const step = stepDefaults[dialog.value.item.steps[stepIndex].type];
  if (!step)
    return;

  dialog.value.item.steps[stepIndex] = copy({ ...step, id: randomString(6) });
};
</script>

<style lang="scss">
.step-add {
  bottom: 1rem;
  right: 1rem;
  position: fixed;
  z-index: 1100;
}
</style>
