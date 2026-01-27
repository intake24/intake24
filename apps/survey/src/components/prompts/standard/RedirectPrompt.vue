<template>
  <div>
    <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
      <v-card-text class="pt-2">
        <v-card v-if="followUpUrl" class="d-flex flex-column align-center" flat tile>
          <v-progress-circular
            v-if="prompt.timer"
            class="mb-6"
            color="secondary"
            :model-value="timerValue"
            :rotate="-90"
            :size="150"
            :width="30"
          >
            <div class="d-flex align-center flex-column">
              <span class="font-weight-bold text-h1">{{ timerSecs }}</span>
            </div>
          </v-progress-circular>
        </v-card>
      </v-card-text>
      <template #actions>
        <v-btn :to="{ name: 'survey-home', params: { surveyId } }">
          <v-icon icon="$home" start />
          {{ $t('common.home') }}
        </v-btn>
        <v-btn
          v-if="feedbackEnabled"
          :disabled="!feedbackAvailable"
          :to="{ name: 'feedback-home', params: { surveyId } }"
        >
          <v-icon icon="$feedback" start />
          {{ $t('recall.actions.feedback') }}
        </v-btn>
        <template v-if="followUpUrl">
          <v-spacer />
          <v-btn
            :href="followUpUrl"
            :target="prompt.target"
            :title="promptI18n.goTo"
          >
            <v-icon icon="$redirect" start />
            {{ promptI18n.goTo }}
          </v-btn>
        </template>
      </template>
    </card-layout>
    <survey-rating
      v-if="prompt.rating"
      v-bind="{ submissionId, surveyId, type: 'recall' }"
      class="bg-grey-lighten-4 pt-6"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { SurveyRating } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'redirect-prompt'>(),
  feedbackAvailable: {
    type: Boolean,
  },
  feedbackEnabled: {
    type: Boolean,
  },
  followUpUrl: {
    type: String,
  },
  submissionId: {
    type: String,
  },
  surveyId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { action, translatePrompt } = usePromptUtils(props, { emit });

const isValid = true;
const timerInterval = ref<undefined | number>(undefined);
const timerValue = ref(props.prompt.timer ? 100 : 0);
const timerTick = computed(() =>
  props.prompt.timer ? Math.round(100 / props.prompt.timer) : 0,
);
const timerSecs = computed(() => {
  if (!props.prompt.timer)
    return 0;

  const timer = Math.round((timerValue.value / 100) * props.prompt.timer);
  return timer > 0 ? timer : 0;
});

const promptI18n = computed(() => translatePrompt(['goTo', 'missingUrl']));

function redirect() {
  if (!props.followUpUrl)
    return;

  window.open(props.followUpUrl, props.prompt.target);
}

function clearTimer() {
  clearInterval(timerInterval.value);
}

function startTimer() {
  if (props.prompt.timer === 0 || !props.followUpUrl)
    return;

  if (props.prompt.timer < 0) {
    redirect();
    return;
  }

  // @ts-expect-error - node types
  timerInterval.value = setInterval(() => {
    timerValue.value -= timerTick.value;

    if (timerValue.value <= 0) {
      clearTimer();
      redirect();
    }
  }, 1000);
}

onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style lang="scss" scoped></style>
