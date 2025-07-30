<template>
  <div class="fas-hero px-4 py-6 py-md-10 d-flex justify-center items-center flex-column">
    <v-card class="px-4 py-6 faqs-hero__card rounded-lg shadow-lg align-self-center" flat>
      <h1 class="text-h1 font-weight-medium text-center px-4 pb-4">
        {{ $t('common.faqs.title') }}
      </h1>
      <h2 class="text-h6 font-weight-medium text-center px-4 pb-4">
        {{ $t('common.faqs.subtitle') }}
      </h2>
    </v-card>
  </div>
  <v-sheet class="py-4 faqs-sections">
    <v-container class="container-max">
      <div class="d-flex flex-column gr-4">
        <v-card
          v-for="section in sections"
          :key="section.id"
          class="pa-5 bg-primary-lighten-5"
          flat
          rounded
          tile
        >
          <div class="text-h5 font-weight-medium mb-4">
            {{ translate(section.title) }}
          </div>
          <v-expansion-panels focusable>
            <v-expansion-panel v-for="items in section.items" :key="items.id">
              <v-expansion-panel-title>
                {{ translate(items.title) }}
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-html="translate(items.content)" />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </div>
    </v-container>
  </v-sheet>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useI18n } from '@intake24/i18n';
import { useFAQs } from '@intake24/survey/stores';

defineOptions({ name: 'FrequentlyAskedQuestions' });

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
.fas-hero {
  position: relative;
  background-image: url('/faq-orange.jpeg');
  background-size: cover;
  background-position: center;
  min-height: 250px;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60%;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 50%, #fff 100%);
  }
}

.faqs-hero__card {
  background-color: rgba(var(--v-theme-primary-lighten-5), 0.75);
}
</style>
