<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-sliders" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.carousel.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-switch
          v-model="toggle"
          class="mx-3"
          hide-details="auto"
          @update:model-value="changeToggle"
        />
      </v-toolbar-items>
    </v-toolbar>
    <v-container>
      <v-row v-if="carousel">
        <v-col cols="12" md="6">
          <v-select
            v-model="carousel.variant"
            hide-details="auto"
            :items="variants"
            :label="$t('survey-schemes.theme.variants._')"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="carousel.color"
            hide-details="auto"
            :items="colors"
            :label="$t('survey-schemes.theme.colors._')"
            variant="outlined"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props" :title="item.raw.title">
                <template #prepend>
                  <span
                    class="mr-2 pa-4 rounded-circle"
                    :style="{ backgroundColor: item.raw.color }"
                  />
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <span
                class="mr-2 pa-2 rounded-circle"
                :style="{ backgroundColor: item.raw.color }"
              />
              {{ item.raw.title }}
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-switch
            v-model="carousel.required"
            hide-details="auto"
            :label="$t('survey-schemes.prompts.carousel.required')"
          />
        </v-col>
      </v-row>
      <div v-if="carousel" class="mt-4">
        <div class="text-h5 mb-4">
          {{ $t('survey-schemes.prompts.carousel.slides.title') }}
        </div>
        <div class="d-flex flex-row ga-2">
          <div>
            <v-btn class="mb-4" color="primary" @click="add">
              <v-icon icon="$add" start />
              {{ $t('survey-schemes.prompts.carousel.slides.add') }}
            </v-btn>
            <v-tabs v-model="selectedSlide" direction="vertical">
              <vue-draggable
                v-model="carousel.slides"
                :animation="300"
                handle=".drag-and-drop__handle"
              >
                <v-tab v-for="(slide, idx) in carousel.slides" :key="slide.id" class="d-flex ga-3" :value="slide.id">
                  <v-icon class="drag-and-drop__handle" icon="$handle" start />
                  {{ $t('survey-schemes.prompts.carousel.slides._') }} #{{ idx + 1 }}
                </v-tab>
              </vue-draggable>
            </v-tabs>
          </div>
          <v-tabs-window v-model="selectedSlide" class="flex-grow-1">
            <v-tabs-window-item v-for="(slide, idx) in carousel.slides" :key="slide.id" :value="slide.id">
              <v-card border flat>
                <v-card-title>
                  <v-icon icon="fas fa-location-arrow" start />
                  {{ $t('survey-schemes.prompts.carousel.slides._') }} #{{ idx + 1 }}
                </v-card-title>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="slide.image.desktop"
                        append-inner-icon="$desktop"
                        hide-details="auto"
                        :label="`${$t('survey-schemes.prompts.carousel.slides.image')} (${$t('survey-schemes.theme.layouts.desktop')})`"
                        prepend-inner-icon="fas fa-image"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="slide.image.mobile"
                        append-inner-icon="$mobile"
                        hide-details="auto"
                        :label="`${$t('survey-schemes.prompts.carousel.slides.image')} (${$t('survey-schemes.theme.layouts.mobile')})`"
                        prepend-inner-icon="fas fa-image"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12">
                      <language-selector
                        v-model="slide.text"
                        border
                        :label="$t('survey-schemes.prompts.carousel.slides.text')"
                        :required="true"
                      >
                        <template v-for="lang in Object.keys(slide.text)" :key="lang" #[`lang.${lang}`]>
                          <html-editor v-model="slide.text[lang]" />
                        </template>
                      </language-selector>
                    </v-col>
                  </v-row>
                </v-container>
                <v-card-actions>
                  <v-spacer />
                  <v-btn class="font-weight-bold" color="error" variant="text" @click="remove(idx)">
                    <v-icon icon="$delete" start />
                    {{ $t('survey-schemes.prompts.carousel.slides.remove') }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-tabs-window-item>
          </v-tabs-window>
        </div>
      </div>
    </v-container>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Carousel } from '@intake24/common/prompts';

import { useVModel } from '@vueuse/core';
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { HtmlEditor } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useSelects } from '@intake24/admin/composables';
import { carouselDefaults } from '@intake24/common/prompts';
import { randomString } from '@intake24/common/util';

defineOptions({ name: 'Carousel' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<Carousel>,
  },
});

const emit = defineEmits(['update:modelValue']);

const { colors, variants } = useSelects();

const carousel = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

const selectedSlide = ref(carousel.value?.slides.length ? carousel.value.slides[0].id : undefined);
const toggle = ref(!!carousel.value);

function changeToggle(enable: boolean | null) {
  carousel.value = enable ? carouselDefaults : undefined;
};

function add() {
  const id = randomString(6);
  carousel.value?.slides.push({
    id,
    text: { en: 'Carousel slide' },
    image: { desktop: '', mobile: '' },
  });

  selectedSlide.value = id;
};

function remove(index: number) {
  carousel.value?.slides.splice(index, 1);
  selectedSlide.value = carousel.value?.slides.at(-1)?.id ?? undefined;
};
</script>

<style lang="scss" scoped></style>
