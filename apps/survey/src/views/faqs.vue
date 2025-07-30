<template>
  <div>
    <v-sheet color="white py-4">
      <h1 class="text-h1 font-weight-medium text-center px-4 pb-4">
        {{ $t('common.faqs.title') }}
      </h1>
      <h2 class="text-h6 font-weight-medium text-center px-4 pb-4">
        {{ $t('common.faqs.subtitle') }}
      </h2>
      <v-container class="container-max">
        <v-row>
          <v-col class="feedback-section" cols="12">
            <v-expansion-panels focusable>
              <v-expansion-panel v-for="(section, index) in sections" :key="index">
                <v-expansion-panel-title>
                  {{ translate(section.title) }}
                </v-expansion-panel-title>
                <v-expansion-panel-text />
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useI18n } from '@intake24/i18n';
import { useFAQs } from '@intake24/survey/stores';

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
});

const { translate } = useI18n();
const faqs = useFAQs();
const { sections } = storeToRefs(faqs);
const { loadSections } = faqs;

onMounted(async () => {
  await loadSections(props.surveyId);
});
</script>

<style lang="scss">
</style>
