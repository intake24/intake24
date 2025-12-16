<template>
  <v-container class="container-max" :class="{ 'pa-0': $vuetify.display.mobile }" fluid>
    <component :is="layout" />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { RecallDesktop, RecallMobile } from '@intake24/survey/components';
import { useSurvey } from '@intake24/survey/stores';
import { sendGtmEvent } from '@intake24/survey/util';

export default defineComponent({
  name: 'SurveyRecall',

  components: { RecallDesktop, RecallMobile },

  beforeRouteEnter({ params }, from, next) {
    sendGtmEvent({
      event: 'startRecall',
      action: 'start',
      scheme_prompts: 'preMeals',
    });
    const survey = useSurvey();

    survey.validateState(survey.data, survey.parameters?.session);

    if (survey.recallAllowed)
      next();
    else
      next({ name: 'survey-home', params });
  },

  computed: {
    layout(): string {
      return this.$vuetify.display.mobile ? 'recall-mobile' : 'recall-desktop';
    },
  },
});
</script>

<style lang="scss" scoped></style>
