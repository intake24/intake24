<template>
  <sleep-schedule-prompt
    v-model="state"
    v-bind="{ prompt, section }"
    @action="action"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { SleepSchedulePrompt } from '@intake24/survey/components/prompts/standard';
import { useSurvey } from '@intake24/survey/stores';

import { createHandlerProps, usePromptHandlerNoStore } from '../composables';

const props = defineProps(createHandlerProps<'sleep-schedule-prompt'>());

const emit = defineEmits(['action']);

const survey = useSurvey();

const getInitialState = computed(() => {
  const { wakeUpTime, sleepTime } = survey.data;

  return {
    panel: 0,
    schedule: {
      wakeUp: wakeUpTime ?? props.prompt.wakeUpTime,
      sleep: sleepTime ?? props.prompt.sleepTime,
    },
  };
});

const { state } = usePromptHandlerNoStore({ emit }, getInitialState);

function action(type: string, ...args: [id?: string, params?: object]) {
  if (type === 'next')
    commitAnswer();

  emit('action', type, ...args);
}

function commitAnswer() {
  survey.setSleepSchedule(state.value.schedule);
}
</script>

<style scoped></style>
