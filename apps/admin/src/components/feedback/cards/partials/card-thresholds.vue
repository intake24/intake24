<template>
  <v-tabs-window-item value="thresholds">
    <v-container>
      <v-row>
        <v-col v-for="(item, key) in { low, high }" :key="key" cols="12" md="6">
          <v-card-title>
            {{ $t(`feedback-schemes.cards.thresholds.${key}`) }}
          </v-card-title>
          <v-card-text>
            <v-switch
              class="my-4"
              hide-details="auto"
              :label="$t('feedback-schemes.cards.thresholds.enabled')"
              :model-value="!!item"
              @update:model-value="toggleThreshold(key, $event)"
            />
            <template v-if="item">
              <v-slider
                v-model.number="item.threshold"
                class="mt-12"
                :label="$t('feedback-schemes.cards.thresholds._')"
                max="100"
                min="0"
                thumb-label="always"
              />
              <language-selector
                v-model="item.message"
                border
                :label="$t('feedback-schemes.cards.thresholds.message')"
              >
                <template v-for="lang in Object.keys(item.message)" :key="lang" #[`lang.${lang}`]>
                  <html-editor v-model="item.message[lang]" />
                </template>
              </language-selector>
            </template>
          </v-card-text>
        </v-col>
      </v-row>
    </v-container>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { CustomCard } from '@intake24/common/feedback';

import { deepEqual } from 'fast-equals';
import { defineComponent } from 'vue';

import { HtmlEditor } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';

export default defineComponent({
  name: 'CardThresholds',

  components: { HtmlEditor, LanguageSelector },

  props: {
    thresholds: {
      type: Object as PropType<Pick<CustomCard, 'high' | 'low'>>,
      required: true,
    },
  },

  emits: ['update:high', 'update:low'],

  data() {
    const { high, low } = this.thresholds;

    return {
      high: high ? { ...high } : null,
      low: low ? { ...low } : null,
    };
  },

  watch: {
    thresholds(val: Pick<CustomCard, 'high' | 'low'>) {
      const { high, low } = this;
      if (deepEqual(val, { high, low }))
        return;

      this.high = val.high === null ? null : { ...val.high };
      this.low = val.low === null ? null : { ...val.low };
    },
    high() {
      this.$emit('update:high', this.high);
    },
    low() {
      this.$emit('update:low', this.low);
    },
  },

  methods: {
    toggleThreshold(key: 'high' | 'low', value: boolean) {
      this[key] = value ? { threshold: 0, message: { en: '' } } : null;
    },
  },
});
</script>

<style lang="scss" scoped></style>
