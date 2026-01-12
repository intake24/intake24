<template>
  <div>
    <slot v-bind="{ checkForHints }" />
    <v-alert
      v-if="!!hint && props.mode === 'alert'"
      border
      class="mt-4"
      color="info"
      density="compact"
      icon="fas fa-lightbulb"
      variant="tonal"
    >
      {{ hint }}
    </v-alert>
    <v-dialog
      max-width="450"
      :model-value="!!hint && props.mode === 'dialog'"
      @keydown.enter="confirm"
      @keydown.esc="tryAgain"
    >
      <v-card>
        <v-card-title class="font-weight-medium text-h4 text-uppercase text-center">
          {{ promptI18n['hints.label'] }}
        </v-card-title>
        <v-card-text class="d-flex flex-column gr-4">
          <v-alert
            class="pa-4 text-uppercase font-weight-medium"
            color="error"
            icon="fas fa-circle-exclamation"
            variant="tonal"
          >
            ... {{ props.modelValue }}
          </v-alert>
          <v-alert
            color="warning"
            icon="fas fa-wrench"
            variant="tonal"
          >
            {{ hint }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-4">
          <v-btn
            class="px-4"
            color="primary"
            :title="promptI18n['hints.tryAgain']"
            variant="flat"
            @click="tryAgain"
          >
            <v-icon icon="fas fa-rotate-left" start />
            {{ promptI18n['hints.tryAgain'] }}
          </v-btn>
          <v-spacer />
          <v-btn
            class="px-4"
            color="secondary"
            :title="promptI18n['hints.confirm']"
            variant="tonal"
            @click="confirm"
          >
            <v-icon icon="fas fa-check" start />
            {{ promptI18n['hints.confirm'] }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { computed, ref } from 'vue';
import type { Prompts } from '@intake24/common/prompts';
import { usePromptUtils } from '@intake24/survey/composables';
import { useI18n } from '@intake24/ui';

const props = defineProps({
  activator: {
    type: String as PropType<'watch' | 'manual'>,
    default: 'watch',
  },
  mode: {
    type: String as PropType<'alert' | 'dialog'>,
    default: 'alert',
  },
  modelValue: {
    type: String as PropType<string | null>,
    default: '',
  },
  prompt: {
    type: Object as PropType<
      Prompts['associated-foods-prompt' | 'edit-meal-prompt' | 'general-associated-foods-prompt' | 'food-search-prompt' | 'recipe-builder-prompt']
    >,
    required: true,
  },
});

const emit = defineEmits(['confirm', 'tryAgain', 'action']);

const { translatePrompt } = usePromptUtils(props, { emit });
const { translate } = useI18n();

const promptI18n = computed(() =>
  translatePrompt([
    'hints.label',
    'hints.confirm',
    'hints.tryAgain',
  ]),
);

const hint = ref<string | null>(null);

const trigger = computed(() =>
  new RegExp(
    props.prompt.hints.filter(({ keyword }) => keyword.length).map(({ keyword }) => `(?<${keyword.join('_')}>${keyword.join('|')})`).join('|'),
    'i',
  ),
);

function checkForHints() {
  if (!props.modelValue || !props.prompt.hints.length)
    return confirm();

  const res = props.modelValue.match(trigger.value);

  if (res) {
    for (const [key, value] of Object.entries(res.groups || {})) {
      if (!value)
        continue;

      const match = props.prompt.hints.find(({ keyword }) => keyword.join('_') === key);
      if (!match)
        continue;

      hint.value = translate(match.text);
      return;
    }
  }

  confirm();
}

function confirm() {
  hint.value = null;
  emit('confirm');
}

function tryAgain() {
  hint.value = null;
  emit('tryAgain');
}

if (props.activator === 'watch') {
  watchDebounced(
    () => props.modelValue,
    async () => {
      checkForHints();
    },
    {
      debounce: 500,
      maxWait: 2000,
      immediate: true,
    },
  );
}
</script>
