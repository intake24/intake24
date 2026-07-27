<template>
  <v-expansion-panel :value="isOverrideMode ? 'override' : section">
    <v-expansion-panel-title>
      <div class="d-flex flex-row justify-content-space-between">
        <v-avatar class="mr-3" color="primary" size="28">
          <span class="text-white font-weight-medium text-title-large">{{ step }}</span>
        </v-avatar>
        <div class="d-flex flex-column">
          <div class="text-title-large">
            {{ title }}
          </div>
          <div class="text-title-small">
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
      <div v-if="!isOverrideMode" class="d-flex justify-end mb-3">
        <v-btn
          color="primary"
          prepend-icon="$add"
          size="small"
          variant="outlined"
          @click="addSubsection"
        >
          {{ `${$t('survey-schemes.prompts.subsections.add')}` }}
        </v-btn>
      </div>

      <vue-draggable
        v-model="subsectionsState"
        :animation="300"
        handle=".prompt-subsection__handle"
      >
        <div
          v-for="(subsection, subsectionIndex) in subsectionsState"
          :key="subsectionKey(subsectionIndex)"
          class="prompt-subsection mb-3"
        >
          <div class="prompt-subsection__title d-flex align-center px-3 py-2">
            <v-avatar class="prompt-subsection__handle drag-and-drop__handle mr-3" icon="$handle" size="26" />
            <span class="text-subtitle-2 font-weight-medium prompt-subsection__name mr-2">
              {{ subsection.name }}
            </span>
            <v-spacer />
            <v-btn
              v-if="!isOverrideMode"
              color="primary"
              icon="$add"
              size="x-small"
              :title="$t('survey-schemes.prompts.create')"
              @click.stop="create(subsectionIndex)"
            />
            <options-menu v-if="!isOverrideMode">
              <template #activator="{ props: menuProps }">
                <v-btn
                  class="ms-2"
                  color="primary"
                  icon="$options"
                  size="x-small"
                  v-bind="menuProps"
                />
              </template>
              <confirm-dialog
                color="info"
                :label="$t('survey-schemes.prompts.subsections.rename')"
                max-width="450px"
                @close="clearRenameSubsection"
                @confirm="renameSubsection(subsectionIndex)"
              >
                <template #activator="{ props: dialogProps }">
                  <v-list-item link v-bind="dialogProps" @click="startRenameSubsection(subsectionIndex)">
                    <v-list-item-title>
                      <v-icon icon="$edit" start />
                      {{ `${$t('survey-schemes.prompts.subsections.rename')}` }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
                <v-text-field
                  v-model="subsectionNameDraft"
                  :label="$t('common.name')"
                  variant="outlined"
                />
              </confirm-dialog>
            </options-menu>
            <v-btn
              v-if="!isOverrideMode && !subsection.prompts.length"
              color="error"
              icon="$delete"
              size="x-small"
              variant="text"
              @click.stop="removeSubsection(subsectionIndex)"
            />
            <v-btn
              color="secondary"
              :icon="subsection.expanded ? '$expand' : '$collapse'"
              size="x-small"
              variant="text"
              @click.stop="toggleSubsectionExpand(subsectionIndex)"
            />
          </div>

          <v-expand-transition>
            <div v-show="subsection.expanded">
              <v-list class="list-border" lines="two">
                <vue-draggable
                  v-model="subsection.prompts"
                  :animation="300"
                  :group="{ name: `prompt-subsection-${section}` }"
                  handle=".drag-and-drop__handle"
                >
                  <prompt-list-item
                    v-for="(prompt, index) in subsection.prompts"
                    :key="`${prompt.id}:${prompt.name}`"
                    v-bind="{
                      errors: errors.get(`prompts.${fullSection}.${globalIndex(subsectionIndex, index)}.*`),
                      mode,
                      prompt,
                      index,
                      templates,
                    }"
                    :move-sections="moveSections(prompt)"
                    :move-subsections="subsectionOptions"
                    @prompt-change-subsection="changeSubsection(subsectionIndex, $event)"
                    @prompt-copy="copy(subsectionIndex, $event)"
                    @prompt-edit="edit(subsectionIndex, $event)"
                    @prompt-move="move(subsectionIndex, $event)"
                    @prompt-remove="remove(subsectionIndex, $event)"
                    @prompt-sync="sync(subsectionIndex, $event)"
                  />
                </vue-draggable>
              </v-list>
            </div>
          </v-expand-transition>
        </div>
      </vue-draggable>

      <prompt-selector ref="selector" v-bind="{ mode, section, promptIds }" @save="save" />
    </v-expansion-panel-text>
  </v-expansion-panel>
  <v-divider />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { SinglePrompt } from '@intake24/common/prompts';
import type {
  MealSection,
  PromptSection,
  PromptSubsectionLayout,
  SurveyPromptSection,
} from '@intake24/common/surveys';

import { deepEqual } from 'fast-equals';
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { OptionsMenu } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { promptSettings } from '@intake24/admin/components/prompts';
import { isMealSection } from '@intake24/common/surveys';
import { copy as copyObject } from '@intake24/common/util';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import PromptSelector from '../prompt-selector.vue';
import LoadPromptDialog from './load-prompt-dialog.vue';
import PromptListItem from './prompt-list-item.vue';

export type MoveSection = { value: string; title: string };
export type MoveSubsection = { value: number; title: string };

export type PromptEvent = {
  index: number;
  prompt: SinglePrompt;
};

type PromptSubsection = {
  name: string;
  expanded: boolean;
  prompts: SinglePrompt[];
};

export interface PromptMoveEvent extends PromptEvent {
  section: MealSection | SurveyPromptSection;
}

export interface PromptSubsectionMoveEvent extends PromptEvent {
  subsectionIndex: number;
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
  subsectionLayouts: {
    type: Array as PropType<PromptSubsectionLayout[]>,
    default: () => [],
  },
  modelValue: {
    type: Array as PropType<SinglePrompt[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'update:subsectionLayouts', 'move']);

const { i18n } = useI18n();

const selector = ref<InstanceType<typeof PromptSelector>>();
const pendingSubsectionIndex = ref<number | null>(null);
const subsectionNameDraft = ref('');

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
const subsectionsState = ref<PromptSubsection[]>(buildSubsections(copyObject(props.modelValue), copyObject(props.subsectionLayouts)));
const prompts = computed<SinglePrompt[]>({
  get: () => flattenSubsections(subsectionsState.value),
  set: (value) => {
    subsectionsState.value = buildSubsections(copyObject(value), copyObject(props.subsectionLayouts));
  },
});
const subsectionOptions = computed<MoveSubsection[]>(() => subsectionsState.value.map((subsection, index) => ({
  value: index,
  title: subsection.name,
})));

function defaultSubsectionName(index: number) {
  if (isOverrideMode.value) {
    return i18n.t(`survey-schemes.overrides.prompts.subsectionName`);
  }
  const sectionTitle = i18n.t(`survey-schemes.prompts.${props.section}.title`);
  const sectionBase = sectionTitle.replace('/\s+prompts$/i', '');

  return `${sectionBase} ${index + 1}`;
}

function subsectionKey(index: number) {
  return `${props.section}:${index}`;
}

function buildSubsections(prompts: SinglePrompt[], subsections: PromptSubsectionLayout[]): PromptSubsection[] {
  if (isOverrideMode.value)
    return [{ name: defaultSubsectionName(0), expanded: true, prompts: [...prompts] }];

  if (!subsections.length)
    return [{ name: defaultSubsectionName(0), expanded: true, prompts: [...prompts] }];

  let offset = 0;
  const items = subsections.map((item, index) => {
    const size = Math.max(0, item.size || 0);
    const subsectionPrompts = prompts.slice(offset, offset + size);
    offset += size;

    return {
      name: item.name || defaultSubsectionName(index),
      expanded: item.expanded ?? true,
      prompts: subsectionPrompts,
    };
  });

  if (offset < prompts.length)
    items.push({ name: defaultSubsectionName(items.length), expanded: true, prompts: prompts.slice(offset) });

  return items.length ? items : [{ name: defaultSubsectionName(0), expanded: true, prompts: [...prompts] }];
}

function flattenSubsections(subsections: PromptSubsection[]) {
  return subsections.flatMap(subsection => subsection.prompts);
}

function serializedSubsections(subsections: PromptSubsection[]): PromptSubsectionLayout[] {
  return subsections.map((subsection, index) => ({
    id: subsectionKey(index),
    size: subsection.prompts.length,
    expanded: subsection.expanded,
    name: subsection.name,
  }));
}

function locate(subsectionIndex: number, index: number) {
  const subsection = subsectionsState.value[subsectionIndex];
  if (!subsection)
    return;

  return { subsection, index };
}

function globalIndex(subsectionIndex: number, index: number) {
  let offset = 0;
  for (let idx = 0; idx < subsectionsState.value.length; idx++) {
    if (idx === subsectionIndex)
      return offset + index;

    offset += subsectionsState.value[idx].prompts.length;
  }

  return index;
}

function ensureSubsectionExists(targetSubsectionIndex?: number | null): PromptSubsection {
  if (typeof targetSubsectionIndex === 'number') {
    const item = subsectionsState.value[targetSubsectionIndex];
    if (item)
      return item;
  }

  if (!subsectionsState.value.length)
    subsectionsState.value.push({ name: defaultSubsectionName(0), expanded: true, prompts: [] });

  return subsectionsState.value.at(-1)!;
};

function clearErrors(index?: number) {
  props.errors.clear(typeof index === 'undefined' ? `prompts.${fullSection.value}.*` : `prompts.${fullSection.value}.${index}.*`);
}

function create(subsectionIndex?: number) {
  if (isOverrideMode.value)
    return;

  pendingSubsectionIndex.value = typeof subsectionIndex === 'number' ? subsectionIndex : null;
  selector.value?.create?.();
};

function load(prompt: SinglePrompt) {
  clearErrors();
  ensureSubsectionExists().prompts.push(prompt);
};

function copy(subsectionIndex: number, { prompt, index }: PromptEvent) {
  const target = locate(subsectionIndex, index);
  if (!target)
    return;

  target.subsection.prompts.splice(index + 1, 0, { ...copyObject(prompt), id: `${prompt.id}-copy`, name: `${prompt.name} (copy)` });
};

function edit(subsectionIndex: number, { prompt, index }: PromptEvent) {
  const itemIndex = globalIndex(subsectionIndex, index);
  const errors = props.errors?.get(`prompts.${fullSection.value}.${itemIndex}.*`);
  selector.value?.edit?.(itemIndex, prompt, errors);
};

function save({ prompt, index }: PromptEvent) {
  if (index === -1) {
    ensureSubsectionExists(pendingSubsectionIndex.value).prompts.push(prompt);
    pendingSubsectionIndex.value = null;
  }
  else {
    let offset = 0;
    for (const subsection of subsectionsState.value) {
      if (index < offset + subsection.prompts.length) {
        subsection.prompts.splice(index - offset, 1, prompt);
        break;
      }

      offset += subsection.prompts.length;
    }
  }

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

function move(subsectionIndex: number, event: PromptMoveEvent) {
  if (isOverrideMode.value)
    return;

  const target = locate(subsectionIndex, event.index);
  if (!target)
    return;

  emit('move', { ...event, index: globalIndex(subsectionIndex, event.index) });
  target.subsection.prompts.splice(event.index, 1);
};

function changeSubsection(subsectionIndex: number, event: PromptSubsectionMoveEvent) {
  if (isOverrideMode.value || subsectionIndex === event.subsectionIndex)
    return;

  const source = locate(subsectionIndex, event.index);
  const target = subsectionsState.value[event.subsectionIndex];
  if (!source || !target)
    return;

  const [prompt] = source.subsection.prompts.splice(event.index, 1);
  if (!prompt)
    return;

  target.prompts.push(prompt);
};

function remove(subsectionIndex: number, index: number) {
  const target = locate(subsectionIndex, index);
  if (!target)
    return;

  clearErrors(globalIndex(subsectionIndex, index));
  target.subsection.prompts.splice(index, 1);
};

function sync(subsectionIndex: number, { prompt, index }: PromptEvent) {
  if (isOverrideMode.value)
    return;

  const target = locate(subsectionIndex, index);
  if (!target)
    return;

  target.subsection.prompts.splice(index, 1, prompt);
};

function addSubsection() {
  subsectionsState.value.push({ name: defaultSubsectionName(subsectionsState.value.length), expanded: true, prompts: [] });
}

function removeSubsection(subsectionIndex: number) {
  const subsection = subsectionsState.value[subsectionIndex];
  if (!subsection || subsection.prompts.length)
    return;

  subsectionsState.value.splice(subsectionIndex, 1);
}

function toggleSubsectionExpand(subsectionIndex: number) {
  const subsection = subsectionsState.value[subsectionIndex];
  if (!subsection)
    return;

  subsection.expanded = !subsection.expanded;
}

function startRenameSubsection(subsectionIndex: number) {
  const subsection = subsectionsState.value[subsectionIndex];
  if (!subsection)
    return;

  subsectionNameDraft.value = subsection.name;
}

function renameSubsection(subsectionIndex: number) {
  const subsection = subsectionsState.value[subsectionIndex];
  if (!subsection)
    return;

  const name = subsectionNameDraft.value.trim();
  if (!name)
    return;

  subsection.name = name;
  clearRenameSubsection();
}

function clearRenameSubsection() {
  subsectionNameDraft.value = '';
}

function update() {
  const prompts = flattenSubsections(subsectionsState.value);
  if (!deepEqual(prompts, props.modelValue))
    emit('update:modelValue', prompts);

  const subsectionLayouts = serializedSubsections(subsectionsState.value);
  if (!deepEqual(subsectionLayouts, props.subsectionLayouts))
    emit('update:subsectionLayouts', subsectionLayouts);
};

function syncFromProps() {
  if (deepEqual(props.modelValue, flattenSubsections(subsectionsState.value)) && deepEqual(props.subsectionLayouts, serializedSubsections(subsectionsState.value)))
    return;

  subsectionsState.value = buildSubsections(copyObject(props.modelValue), copyObject(props.subsectionLayouts));
}

watch(() => props.modelValue, syncFromProps, { deep: true });
watch(() => props.subsectionLayouts, syncFromProps, { deep: true });

watch(subsectionsState, () => {
  update();
}, { deep: true });
</script>

<style lang="scss">
.prompt-subsection {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
}

.prompt-subsection__title {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.prompt-subsection__name {
  max-width: 260px;
}

.prompt-subsection__handle {
  cursor: grab;
}
</style>
