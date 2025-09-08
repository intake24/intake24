<template>
  <v-tabs-window-item value="unit">
    <language-selector
      v-model="internalUnit.name"
      border
      class="mb-4"
      :label="$t('feedback-schemes.cards.unit.name')"
    >
      <template v-for="lang in Object.keys(internalUnit.name)" :key="lang" #[`lang.${lang}`]>
        <v-text-field
          v-model="internalUnit.name[lang]"
          hide-details="auto"
          :label="$t('feedback-schemes.cards.unit.name')"
          :rules="nameRules"
          variant="outlined"
        />
      </template>
    </language-selector>
    <language-selector
      v-model="internalUnit.description"
      border
      :label="$t('feedback-schemes.cards.unit.description')"
    >
      <template v-for="lang in Object.keys(internalUnit.description)" :key="lang" #[`lang.${lang}`]>
        <html-editor v-model="internalUnit.description[lang]" />
      </template>
    </language-selector>
  </v-tabs-window-item>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { deepEqual } from 'fast-equals';
import { defineComponent } from 'vue';

import { HtmlEditor } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import type { RuleCallback } from '@intake24/admin/types';
import type { CustomCard } from '@intake24/common/feedback';
import { copy } from '@intake24/common/util';

export default defineComponent({
  name: 'CardUnit',

  components: { HtmlEditor, LanguageSelector },

  props: {
    unit: {
      type: Object as PropType<CustomCard['unit']>,
      required: true,
    },
    nameRequired: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['update:unit'],

  data() {
    return {
      internalUnit: copy(this.unit),
    };
  },

  computed: {
    nameRules(): RuleCallback[] {
      return this.nameRequired
        ? [
            (value: string | null): boolean | string =>
              !!value || this.$t('feedback-schemes.cards.unit.required'),
          ]
        : [];
    },
  },

  watch: {
    unit(val: CustomCard['unit']) {
      if (deepEqual(val, this.internalUnit))
        return;

      this.internalUnit = copy(val);
    },
    internalUnit: {
      handler() {
        if (deepEqual(this.unit, this.internalUnit))
          return;

        this.$emit('update:unit', this.internalUnit);
      },
      deep: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
