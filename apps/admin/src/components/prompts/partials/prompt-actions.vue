<template>
  <v-tabs-window-item value="actions">
    <v-row>
      <v-col cols="6">
        <v-switch
          v-model="toggle"
          hide-details="auto"
          :label="$t('survey-schemes.actions.enable')"
          @update:model-value="changeToggle"
        />
      </v-col>
      <v-col v-if="currentActions" cols="6">
        <v-switch
          v-model="currentActions.both"
          hide-details="auto"
          :label="$t('survey-schemes.actions.both')"
        />
      </v-col>
    </v-row>
    <div v-if="currentActions" class="mt-4">
      <div class="text-h5 mb-4">
        {{ $t(`survey-schemes.actions.title`) }}
      </div>
      <div class="d-flex flex-row ga-2">
        <div>
          <v-btn class="mb-4" color="primary" @click="add">
            <v-icon icon="$add" start />
            {{ $t(`survey-schemes.actions.add`) }}
          </v-btn>
          <v-tabs v-model="selectedAction" direction="vertical">
            <vue-draggable
              v-model="currentActions.items"
              :animation="300"
              handle=".drag-and-drop__handle"
              @end="update"
            >
              <v-tab v-for="(action, idx) in currentActions.items" :key="action.id" class="d-flex ga-3" :value="action.id">
                <v-icon class="drag-and-drop__handle" icon="$handle" start />
                {{ $t(`survey-schemes.actions.types.${action.type}`) }}({{ idx + 1 }})
              </v-tab>
            </vue-draggable>
          </v-tabs>
        </div>
        <v-tabs-window v-model="selectedAction" class="flex-grow-1">
          <v-tabs-window-item v-for="(action, idx) in currentActions.items" :key="action.id" :value="action.id">
            <v-card border flat>
              <v-card-title>
                <v-icon icon="fas fa-location-arrow" start />
                {{ $t(`survey-schemes.actions.types._`) }} #{{ idx + 1 }}
              </v-card-title>
              <v-container>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="action.type"
                      hide-details="auto"
                      :items="availableActions"
                      :label="$t('survey-schemes.actions.types._')"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col class="my-auto" cols="12" md="6">
                    <v-select
                      v-model="action.layout"
                      hide-details="auto"
                      :items="layouts"
                      :label="$t('survey-schemes.theme.layouts._')"
                      multiple
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="action.variant"
                      hide-details="auto"
                      :items="variants"
                      :label="$t('survey-schemes.theme.variants._')"
                      variant="outlined"
                    >
                      <template #item="{ item, props }">
                        <v-list-item v-bind="props" :title="item.title">
                          <template #prepend>
                            <v-btn
                              class="me-4"
                              color="primary"
                              :title="item.title"
                              :variant="item.value"
                            >
                              {{ $t('survey-schemes.actions._') }}
                            </v-btn>
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="action.color"
                      hide-details="auto"
                      :items="colors"
                      :label="$t('survey-schemes.theme.colors._')"
                      variant="outlined"
                    >
                      <template #item="{ item, props }">
                        <v-list-item v-bind="props" :title="item.raw.title">
                          <template #prepend>
                            <span
                              class="mr-2 pa-4 rounded-circle"
                              :style="{ backgroundColor: item.raw.color }"
                            />
                          </template>
                        </v-list-item>
                      </template>
                      <template #selection="{ item }">
                        <span
                          class="mr-2 pa-2 rounded-circle"
                          :style="{ backgroundColor: item.raw.color }"
                        />
                        {{ item.raw.title }}
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="action.icon"
                      hide-details="auto"
                      :label="$t('survey-schemes.actions.icon')"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <json-editor-dialog v-model="action.params">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" block class="h-100" size="large" variant="tonal">
                          <v-icon icon="fas fa-code" start />
                          {{ $t('survey-schemes.actions.parameters') }}
                        </v-btn>
                      </template>
                    </json-editor-dialog>
                  </v-col>
                  <v-col cols="12" md="6">
                    <language-selector
                      v-model="action.text"
                      border
                      :label="$t('survey-schemes.actions.text')"
                      :required="true"
                    >
                      <template v-for="lang in Object.keys(action.text)" :key="lang" #[`lang.${lang}`]>
                        <v-text-field
                          v-model="action.text[lang]"
                          hide-details="auto"
                          :label="$t('survey-schemes.actions.text')"
                          :rules="[]"
                          variant="outlined"
                        />
                      </template>
                    </language-selector>
                  </v-col>
                  <v-col cols="12" md="6">
                    <language-selector
                      v-model="action.label"
                      border
                      :label="$t('survey-schemes.actions.label')"
                    >
                      <template v-for="lang in Object.keys(action.label)" :key="lang" #[`lang.${lang}`]>
                        <v-text-field
                          v-model="action.label[lang]"
                          hide-details="auto"
                          :label="$t('survey-schemes.actions.label')"
                          :rules="[]"
                          variant="outlined"
                        />
                      </template>
                    </language-selector>
                  </v-col>
                </v-row>
              </v-container>
              <v-card-actions>
                <v-spacer />
                <v-btn class="font-weight-bold" color="error" variant="text" @click="remove(idx)">
                  <v-icon icon="$delete" start />
                  {{ $t('survey-schemes.actions.remove') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </div>
    </div>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { deepEqual } from 'fast-equals';
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useSelects } from '@intake24/admin/composables';
import { withIdList } from '@intake24/admin/util';
import { defaultAction } from '@intake24/common/prompts';
import type { Actions } from '@intake24/common/prompts';
import { copy, randomString } from '@intake24/common/util';

defineOptions({ name: 'PromptActions' });

const props = defineProps({
  actions: {
    type: Object as PropType<Actions>,
  },
});

const emit = defineEmits(['update:actions']);

const { actions: availableActions, colors, layouts, variants } = useSelects();

const currentActions = ref(props.actions ? { ...props.actions, items: withIdList(props.actions.items) } : undefined);
const selectedAction = ref(currentActions.value?.items.length ? currentActions.value.items[0].id : undefined);
const toggle = ref(!!props.actions);

const outputActions = computed(() => {
  if (!currentActions.value)
    return undefined;

  return {
    ...currentActions.value,
    items: currentActions.value.items.map(({ id, ...rest }) => copy(rest)),
  };
});

function changeToggle(enable: boolean | null) {
  currentActions.value = enable ? { both: false, items: [] } : undefined;
};

function add() {
  const id = randomString(6);
  currentActions.value?.items.push(copy({ ...defaultAction, id }));

  selectedAction.value = id;
};

function remove(index: number) {
  currentActions.value?.items.splice(index, 1);
  selectedAction.value = currentActions.value?.items.at(-1)?.id ?? undefined;
};

function update() {
  emit('update:actions', outputActions.value);
};

watch(() => props.actions, (val) => {
  if (deepEqual(val, outputActions.value))
    return;

  currentActions.value = val ? { ...val, items: withIdList(val.items) } : undefined;
  toggle.value = !!val;
});

watch(outputActions, () => {
  update();
}, { deep: true });
</script>

<style lang="scss" scoped></style>
