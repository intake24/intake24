<template>
  <v-list-item
    :class="errors.length ? 'text-error' : undefined"
    :variant="errors.length ? 'tonal' : undefined"
  >
    <template #prepend>
      <v-avatar class="drag-and-drop__handle" icon="$handle" />
    </template>
    <v-list-item-title>{{ prompt.name }}</v-list-item-title>
    <v-list-item-subtitle>
      {{ `ID: ${prompt.id} | Type: ${prompt.component}` }}
    </v-list-item-subtitle>
    <v-list-item-subtitle v-if="!isOverrideMode && hasTemplate">
      <v-icon :color="isInSyncWithTemplate ? `success` : `warning`" start>
        $sync
      </v-icon>
      <span color="success">
        {{ $t(`survey-scheme-prompts.sync.${isInSyncWithTemplate ? 'true' : 'false'}`) }}
      </span>
    </v-list-item-subtitle>
    <template #append>
      <list-item-error :errors="errors" />
      <v-list-item-action>
        <v-btn icon="$edit" :title="$t('survey-schemes.prompts.edit')" @click.stop="edit" />
      </v-list-item-action>
      <v-list-item-action v-if="!isOverrideMode">
        <v-menu
          v-model="contextMenu"
          close-on-content-click
          max-width="600px"
          :persistent="false"
        >
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon color="secondary-lighten-1">
                $options
              </v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item link @click="copy">
              <v-list-item-title>
                <v-icon icon="fas fa-copy" start />
                {{ $t('survey-schemes.prompts.copy') }}
              </v-list-item-title>
            </v-list-item>
            <confirm-dialog
              color="info"
              :label="$t('survey-schemes.prompts.move')"
              max-width="450px"
              @close="clearMoveToSection"
              @confirm="move"
            >
              <template #activator="{ props }">
                <v-list-item link v-bind="props">
                  <v-list-item-title>
                    <v-icon icon="fas fa-exchange-alt" start />
                    {{ $t('survey-schemes.prompts.move') }}
                  </v-list-item-title>
                </v-list-item>
              </template>
              <v-select
                v-model="moveToSection"
                hide-details="auto"
                :items="moveSections"
                :label="$t('survey-schemes.prompts.section')"
                variant="outlined"
              />
            </confirm-dialog>
            <save-as-template-dialog
              v-if="can('survey-scheme-prompts:create') && !hasTemplate"
              :prompt="prompt"
            />
            <confirm-dialog
              v-if="hasTemplate && !isInSyncWithTemplate"
              color="secondary-lighten-1"
              :label="$t('survey-scheme-prompts.sync.synchronize')"
              max-width="450px"
              @confirm="sync"
            >
              <template #activator="{ props }">
                <v-list-item v-bind="props" link>
                  <v-list-item-title>
                    <v-icon icon="$sync" start />
                    {{ $t('survey-scheme-prompts.sync.synchronize') }}
                  </v-list-item-title>
                </v-list-item>
              </template>
              {{ $t('survey-scheme-prompts.sync.confirm') }}
            </confirm-dialog>
          </v-list>
        </v-menu>
      </v-list-item-action>
      <v-list-item-action>
        <confirm-dialog
          color="error"
          icon
          icon-left="$delete"
          :label="$t('survey-schemes.prompts.remove')"
          @confirm="remove"
        >
          {{ $t('common.action.confirm.delete', { name: prompt.name }) }}
        </confirm-dialog>
      </v-list-item-action>
    </template>
  </v-list-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { MoveSection } from './prompt-list.vue';
import { deepEqual } from 'fast-equals';
import { computed, ref } from 'vue';
import { ListItemError } from '@intake24/admin/components/lists';
import type { Prompt } from '@intake24/common/prompts';
import { copy as copyObject } from '@intake24/common/util';
import { ConfirmDialog } from '@intake24/ui';
import SaveAsTemplateDialog from './save-as-template-dialog.vue';

defineOptions({ name: 'PromptListItem' });

const props = defineProps({
  errors: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  mode: {
    type: String as PropType<'full' | 'override'>,
    default: 'full',
  },
  prompt: {
    type: Object as PropType<Prompt>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  moveSections: {
    type: Array as PropType<MoveSection[]>,
    default: () => [],
  },
  templates: {
    type: Array as PropType<Prompt[]>,
    default: () => [],
  },
});

const emit = defineEmits(['promptCopy', 'promptEdit', 'promptMove', 'promptRemove', 'promptSync']);

const contextMenu = ref(false);
const moveToSection = ref<string | null>(null);

const isOverrideMode = computed(() => props.mode === 'override');
const template = computed(() => props.templates.find(
  template => template.id === props.prompt.id && template.name === props.prompt.name,
));
const hasTemplate = computed(() => !!template.value);

const isInSyncWithTemplate = computed(() => !!template.value && deepEqual(props.prompt, template.value));

function copy() {
  const { index, prompt } = props;
  emit('promptCopy', { index, prompt });
};

function edit() {
  const { index, prompt } = props;
  emit('promptEdit', { index, prompt });
};

function move() {
  if (!moveToSection.value)
    return;

  emit('promptMove', {
    section: moveToSection.value,
    index: props.index,
    prompt: copyObject(props.prompt),
  });

  // DOM object is destroyed so we have to clear it manually as event can't be emitted anymore
  clearMoveToSection();
};

function clearMoveToSection() {
  moveToSection.value = null;
};

function remove() {
  emit('promptRemove', props.index);
};

function sync() {
  if (!template.value || isInSyncWithTemplate.value)
    return;

  emit('promptSync', {
    prompt: copyObject(template.value),
    index: props.index,
  });
};
</script>
