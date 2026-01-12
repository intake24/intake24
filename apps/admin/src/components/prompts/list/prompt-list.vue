<template>
  <v-expansion-panel :value="isOverrideMode ? 'override' : section">
    <v-expansion-panel-title>
      <div class="d-flex flex-row justify-content-space-between">
        <v-avatar class="mr-3" color="primary" size="28">
          <span class="text-white font-weight-medium text-h6">{{ step }}</span>
        </v-avatar>
        <div class="d-flex flex-column">
          <div class="text-h6">
            {{ title }}
          </div>
          <div class="text-subtitle-2">
            {{ subtitle }}
          </div>
        </div>
      </div>
      <template #actions="{ expanded }">
        <div class="d-flex align-center">
          <template v-if="expanded">
            <v-btn
              v-if="!isOverrideMode"
              color="primary"
              icon="$add"
              size="small"
              :title="$t('survey-schemes.prompts.create')"
              @click.stop="create"
            />
            <options-menu>
              <load-prompt-dialog
                :items="isOverrideMode ? templates : undefined"
                :prompt-ids="promptIds"
                :scheme-id="$route.params.id.toString()"
                @load="load"
              />
              <json-editor-dialog v-model="prompts" />
            </options-menu>
          </template>
          <v-icon class="ms-2" :icon="expanded ? '$expand' : '$collapse'" />
        </div>
      </template>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-list class="list-border" lines="two">
        <vue-draggable
          v-model="prompts"
          :animation="300"
          handle=".drag-and-drop__handle"
        >
          <prompt-list-item
            v-for="(prompt, index) in prompts"
            :key="`${prompt.id}:${prompt.name}`"
            v-bind="{
              errors: errors.get(`prompts.${fullSection}.${index}.*`),
              mode,
              prompt,
              index,
              templates,
            }"
            :move-sections="moveSections(prompt)"
            @prompt-copy="copy"
            @prompt-edit="edit"
            @prompt-move="move"
            @prompt-remove="remove"
            @prompt-sync="sync"
          />
        </vue-draggable>
      </v-list>
      <prompt-selector ref="selector" v-bind="{ mode, section, promptIds }" @save="save" />
    </v-expansion-panel-text>
  </v-expansion-panel>
  <v-divider />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { deepEqual } from 'fast-equals';
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { OptionsMenu } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { promptSettings } from '@intake24/admin/components/prompts';
import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { SinglePrompt } from '@intake24/common/prompts';
import { isMealSection } from '@intake24/common/surveys';
import type { MealSection, PromptSection, SurveyPromptSection } from '@intake24/common/surveys';
import { copy as copyObject } from '@intake24/common/util';

import { useI18n } from '@intake24/ui';
import PromptSelector from '../prompt-selector.vue';
import LoadPromptDialog from './load-prompt-dialog.vue';
import PromptListItem from './prompt-list-item.vue';

export type MoveSection = { value: string; title: string };

export type PromptEvent = {
  index: number;
  prompt: SinglePrompt;
};

export interface PromptMoveEvent extends PromptEvent {
  section: MealSection | SurveyPromptSection;
}

defineOptions({ name: 'PromptList' });

const props = defineProps({
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  mode: {
    type: String as PropType<'full' | 'override'>,
    default: 'full',
  },
  section: {
    type: String as PropType<PromptSection>,
  },
  step: {
    type: Number,
    default: 1,
  },
  promptIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  templates: {
    type: Array as PropType<SinglePrompt[]>,
    default: () => [],
  },
  modelValue: {
    type: Array as PropType<SinglePrompt[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'move']);

const { i18n } = useI18n();

const selector = ref<InstanceType<typeof PromptSelector>>();
const prompts = ref(copyObject(props.modelValue));

const isOverrideMode = computed(() => props.mode === 'override');
const title = computed(() => i18n.t(
  isOverrideMode.value
    ? `survey-schemes.overrides.prompts.title`
    : `survey-schemes.prompts.${props.section}.title`,
));
const subtitle = computed(() => i18n.t(
  isOverrideMode.value
    ? `survey-schemes.overrides.prompts.subtitle`
    : `survey-schemes.prompts.${props.section}.subtitle`,
));
const fullSection = computed(() => isMealSection(props.section) ? `meals.${props.section}` : props.section);

function clearErrors(index?: number) {
  props.errors.clear(typeof index === 'undefined' ? `prompts.${fullSection.value}.*` : `prompts.${fullSection.value}.${index}.*`);
}

function create() {
  if (isOverrideMode.value)
    return;

  selector.value?.create();
};

function load(prompt: SinglePrompt) {
  clearErrors();
  prompts.value.push(prompt);
};

function copy({ prompt, index }: PromptEvent) {
  prompts.value.splice(index + 1, 0, { ...copyObject(prompt), id: `${prompt.id}-copy`, name: `${prompt.name} (copy)` });
};

function edit({ prompt, index }: PromptEvent) {
  const errors = props.errors.get(`prompts.${fullSection.value}.${index}.*`);
  selector.value?.edit(index, prompt, errors);
};

function save({ prompt, index }: PromptEvent) {
  if (index === -1)
    prompts.value.push(prompt);
  else prompts.value.splice(index, 1, prompt);

  clearErrors(index);
};

function moveSections(prompt: SinglePrompt): MoveSection[] {
  return promptSettings[prompt.component].sections
    .filter(item => item !== props.section)
    .map(item => ({
      value: item,
      title: i18n.t(`survey-schemes.prompts.${item}.title`),
    }));
};

function move(event: PromptMoveEvent) {
  if (isOverrideMode.value)
    return;

  emit('move', event);
  prompts.value.splice(event.index, 1);
};

function remove(index: number) {
  clearErrors(index);
  prompts.value.splice(index, 1);
};

function sync({ prompt, index }: PromptEvent) {
  if (isOverrideMode.value)
    return;

  prompts.value.splice(index, 1, prompt);
};

function update() {
  emit('update:modelValue', prompts.value);
};

watch(() => props.modelValue, (val) => {
  if (deepEqual(val, prompts.value))
    return;

  prompts.value = [...val];
});

watch(prompts, (val) => {
  if (deepEqual(val, props.modelValue))
    return;

  update();
}, { deep: true });
</script>

<style lang="scss">
</style>
