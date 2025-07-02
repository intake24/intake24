<template>
  <v-card flat>
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('survey-schemes.prompts.foodSearchHints.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        rounded
        :title="$t('survey-schemes.prompts.foodSearchHints.add')"
        @click="add"
      >
        <v-icon icon="$add" start />
        {{ $t('survey-schemes.prompts.foodSearchHints.add') }}
      </v-btn>
    </v-toolbar>
    <v-card-text v-if="hints.length" class="px-0 d-flex flex-column ga-4">
      <v-card
        v-for="(hint, idx) in hints"
        :key="idx" border
        class="d-flex flex-row align-items-stretch"
        flat
      >
        <div class="flex-grow-1 d-flex flex-column ga-2">
          <custom-list
            v-model="hint.keyword"
            flat
            :item="$t('survey-schemes.prompts.foodSearchHints.keyword')"
            tile
          />
          <language-selector
            v-model="hint.text"
            :label="$t('survey-schemes.prompts.foodSearchHints.text')"
            required
            tile
          >
            <template v-for="lang in Object.keys(hint.text)" :key="lang" #[`lang.${lang}`]>
              <v-text-field
                v-model="hint.text[lang]"
                hide-details="auto"
                :label="$t('survey-schemes.prompts.foodSearchHints.text')"
                :name="`text.${idx}.${lang}`"
              />
            </template>
          </language-selector>
        </div>
        <div>
          <v-btn
            class="h-100"
            color="error"
            :rounded="false"
            :title="$t('survey-schemes.prompts.foodSearchHints.remove')"
            variant="tonal"
            @click="remove(idx)"
          >
            <v-icon icon="$delete" />
          </v-btn>
        </div>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { CustomList } from '@intake24/admin/components/lists';
import type { FoodSearchHint } from '@intake24/common/prompts';

const props = defineProps({
  modelValue: {
    type: Array as PropType<FoodSearchHint[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const hints = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

function add() {
  hints.value.push({ keyword: [], text: { en: '' } });
}

function remove(idx: number) {
  hints.value.splice(idx, 1);
}
</script>

<style lang="scss" scoped></style>
