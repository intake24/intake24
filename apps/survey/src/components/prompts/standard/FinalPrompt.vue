<template>
  <div>
    <card-layout v-bind="{ food, meal, prompt, section, isValid }" @action="action">
      <template #actions>
        <v-btn
          :to="{ name: 'survey-home', params: { surveyId } }"
        >
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
import { SurveyRating } from '@intake24/survey/components/elements';
import { usePromptUtils } from '@intake24/survey/composables';

import { CardLayout } from '../layouts';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'final-prompt'>(),
  feedbackAvailable: {
    type: Boolean,
  },
  feedbackEnabled: {
    type: Boolean,
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

const { action } = usePromptUtils(props, { emit });

const isValid = true;
</script>

<style lang="scss" scoped></style>
