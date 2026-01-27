<template>
  <div class="d-flex flex-row ga-2">
    <v-tabs v-model="selectedSentiment" direction="vertical">
      <v-btn class="mb-4" color="secondary" @click="add">
        <v-icon icon="$add" start />
        {{ $t(`feedback-schemes.sentiments.add`) }}
      </v-btn>
      <v-tab v-for="(sentiment, index) in sentiments" :key="index" :value="index">
        <v-icon icon="fas fa-face-smile" start />
        {{ `${$t(`feedback-schemes.sentiments._`)} ${index + 1}` }}
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="selectedSentiment" class="flex-grow-1" vertical>
      <v-tabs-window-item v-for="(sentiment, index) in sentiments" :key="index" :value="index">
        <v-card border>
          <v-card-title>
            <v-icon icon="fas fa-face-smile" start />
            {{ `${$t(`feedback-schemes.sentiments._`)} ${index + 1}` }}
          </v-card-title>
          <v-container fluid>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="sentiment.sentiment"
                  hide-details="auto"
                  :items="availableSentiments"
                  :label="$t('feedback-schemes.sentiments._')"
                  multiple
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="sentiment.sentimentType"
                  hide-details="auto"
                  :items="availableCharacterSentimentTypes"
                  :label="$t('feedback-schemes.characterSentimentTypes._')"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <language-selector v-model="sentiment.name" border :label="$t('common.name')">
                  <template v-for="lang in Object.keys(sentiment.name)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="sentiment.name[lang]"
                      hide-details="auto"
                      :label="$t('common.name')"
                      variant="outlined"
                    />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12">
                <v-btn
                  block
                  color="error"
                  size="large"
                  :title="$t(`feedback-schemes.sentiments.remove`)"
                  @click.stop="remove"
                >
                  <v-icon icon="$delete" start />
                  {{ $t(`feedback-schemes.sentiments.remove`) }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { CharacterSentiment } from '@intake24/common/feedback';

import { useVModel } from '@vueuse/core';
import { ref } from 'vue';

import { LanguageSelector } from '@intake24/admin/components/forms';
import { characterSentimentTypes, sentiments as defaultSentiments } from '@intake24/common/feedback';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'CharacterSentiments' });

const props = defineProps({
  modelValue: {
    type: Array as PropType<CharacterSentiment[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { i18n: { t } } = useI18n();

const characterSentimentDefaults: CharacterSentiment = {
  sentiment: [],
  sentimentType: 'happy',
  name: {},
};
const availableSentiments = defaultSentiments.map(value => ({
  title: t(`feedback-schemes.sentiments.${value}`),
  value,
}));
const availableCharacterSentimentTypes = characterSentimentTypes.map(value => ({
  title: t(`feedback-schemes.characterSentimentTypes.${value}`),
  value,
}));

const selectedSentiment = ref(0);
const sentiments = useVModel(props, 'modelValue', emit, { deep: true, passive: true, clone: copy });

function add() {
  sentiments.value.push(copy(characterSentimentDefaults));
};

function remove(index: number) {
  sentiments.value.splice(index, 1);
};
</script>

<style lang="scss" scoped></style>
