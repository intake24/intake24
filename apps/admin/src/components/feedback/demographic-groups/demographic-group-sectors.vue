<template>
  <div class="d-flex flex-row ga-2">
    <v-tabs v-model="selectedSector" direction="vertical">
      <v-btn class="my-4" color="secondary" @click="add">
        <v-icon icon="$add" start />
        {{ $t(`feedback-schemes.demographic-groups.sectors.add`) }}
      </v-btn>
      <v-tab v-for="(sector, index) in sectors" :key="index">
        <v-icon icon="fas fa-scale-balanced" start />
        {{ `${$t(`feedback-schemes.demographic-groups.sectors._`)} ${index + 1}` }}
      </v-tab>
    </v-tabs>
    <v-tabs-window v-model="selectedSector" class="flex-grow-1">
      <v-tabs-window-item v-for="(sector, index) in sectors" :key="index">
        <v-card tile>
          <v-card-title>
            <v-icon icon="fas fa-scale-balanced" start />
            {{ `${$t(`feedback-schemes.demographic-groups.sectors._`)} ${index + 1}` }}
          </v-card-title>
          <v-container fluid>
            <v-row>
              <v-col cols="12" lg="4" md="6">
                <v-select
                  v-model="sector.sentiment"
                  hide-details="auto"
                  :items="sentiments"
                  :label="$t('feedback-schemes.sentiments._')"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" lg="4" md="6">
                <v-select
                  v-model="sector.intake"
                  hide-details="auto"
                  :items="intakes"
                  :label="$t('feedback-schemes.demographic-groups.intake')"
                  multiple
                  variant="outlined"
                />
              </v-col>
              <v-col class="d-flex justify-end" cols="12" lg="4" md="6">
                <div class="mr-4 text-subtitle-1">
                  <v-icon icon="fas fa-left-right" start />
                  {{ $t('feedback-schemes.ranges._') }}
                </div>
                <div>
                  <v-text-field
                    v-model.number="sector.range.start"
                    class="mb-4"
                    density="compact"
                    hide-details="auto"
                    :label="$t('feedback-schemes.ranges.start')"
                    variant="outlined"
                  />
                  <v-text-field
                    v-model.number="sector.range.end"
                    density="compact"
                    hide-details="auto"
                    :label="$t('feedback-schemes.ranges.end')"
                    variant="outlined"
                  />
                </div>
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="sector.name"
                  border
                  :label="$t('feedback-schemes.demographic-groups.name')"
                >
                  <template v-for="lang in Object.keys(sector.name)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="sector.name[lang]"
                      hide-details="auto"
                      :label="$t('feedback-schemes.demographic-groups.name')"
                      :rules="nameRules"
                      variant="outlined"
                    />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="sector.summary"
                  border
                  :label="$t('feedback-schemes.demographic-groups.summary')"
                >
                  <template v-for="lang in Object.keys(sector.summary)" :key="lang" #[`lang.${lang}`]>
                    <html-editor v-model="sector.summary[lang]" />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="sector.description"
                  border
                  :label="$t('feedback-schemes.demographic-groups.description')"
                >
                  <template v-for="lang in Object.keys(sector.description)" :key="lang" #[`lang.${lang}`]>
                    <html-editor v-model="sector.description[lang]" />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12">
                <v-btn
                  block
                  color="error"
                  size="large"
                  :title="$t(`feedback-schemes.demographic-groups.sectors.remove`)"
                  @click.stop="remove"
                >
                  <v-icon icon="$delete" start />
                  {{ $t(`feedback-schemes.demographic-groups.sectors.remove`) }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { RuleCallback } from '@intake24/admin/types';
import type { DemographicGroupScaleSector } from '@intake24/common/feedback';

import { deepEqual } from 'fast-equals';
import { defineComponent, ref } from 'vue';

import { HtmlEditor } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { demographicGroupScaleSectorDefaults, sentiments } from '@intake24/common/feedback';
import { copy } from '@intake24/common/util';

export default defineComponent({
  name: 'DemographicGroupSectors',

  components: { HtmlEditor, LanguageSelector },

  props: {
    modelValue: {
      type: Array as PropType<DemographicGroupScaleSector[]>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup() {
    const selectedSector = ref(0);

    return {
      selectedSector,
    };
  },

  data() {
    return {
      demographicGroupScaleSectorDefaults,
      sectors: this.modelValue,
      intakes: ['summary', 'description'].map(value => ({
        title: this.$t(`feedback-schemes.demographic-groups.${value}`),
        value,
      })),
      sentiments: sentiments.map(value => ({
        title: this.$t(`feedback-schemes.sentiments.${value}`),
        value,
      })),
    };
  },

  computed: {
    nameRules(): RuleCallback[] {
      return [
        (value: string | null): boolean | string =>
          !!value || this.$t('feedback-schemes.demographic-groups.required'),
      ];
    },
  },

  watch: {
    modelValue(val) {
      if (deepEqual(val, this.sectors))
        return;

      this.sectors = [...val];
    },
    sectors: {
      handler() {
        this.update();
      },
      deep: true,
    },
  },

  methods: {
    add() {
      this.sectors.push(copy(demographicGroupScaleSectorDefaults));
    },

    remove(index: number) {
      this.sectors.splice(index, 1);
    },

    update() {
      this.$emit('update:modelValue', this.sectors);
    },
  },
});
</script>

<style lang="scss" scoped></style>
