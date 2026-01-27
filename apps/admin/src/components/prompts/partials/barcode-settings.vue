<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-barcode" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.barcodes.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-select
        :items="barcodes"
        :label="$t('survey-schemes.prompts.barcodes.providers._')"
        :model-value="barcode.type"
        name="barcode"
        variant="outlined"
        @update:model-value="update('type', $event)"
      />
      <template v-if="barcode.type !== 'none'">
        <v-select

          :items="readers"
          :label="$t('survey-schemes.prompts.barcodes.readers._')"
          :model-value="barcode.readers"
          multiple
          name="readers"
          variant="outlined"
          @update:model-value="update('readers', $event)"
        />
        <v-label>{{ $t('survey-schemes.prompts.barcodes.feedback._') }}</v-label>
        <v-switch
          hide-details="auto"
          :label="$t('survey-schemes.prompts.barcodes.feedback.vibration')"
          :model-value="barcode.feedback.vibration"
          @update:model-value="update('feedback', { ...barcode.feedback, vibration: $event })"
        />
        <v-switch
          disabled
          hide-details="auto"
          :label="$t('survey-schemes.prompts.barcodes.feedback.audio')"
          :model-value="barcode.feedback.audio"
          @update:model-value="update('feedback', { ...barcode.feedback, audio: $event })"
        />
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { BarcodeScannerOptions } from '@intake24/common/barcodes';

import { computed, defineComponent } from 'vue';

import { barcodeReaders, barcodeScanners, defaultBarcodeScannerOptions } from '@intake24/common/barcodes';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

export default defineComponent({
  name: 'BarcodeScannerSettings',

  props: {
    barcode: {
      type: Object as PropType<BarcodeScannerOptions>,
      required: true,
    },
  },

  emits: ['update:barcode'],

  setup(props, { emit }) {
    const { i18n } = useI18n();

    const barcodes = barcodeScanners.map(value => ({
      title: i18n.t(`survey-schemes.prompts.barcodes.providers.${value}`),
      value,
    }));

    const readers = computed(() => {
      return barcodeReaders[props.barcode.type];
    });

    const update = (field: string, value: any) => {
      if (field === 'type') {
        emit('update:barcode', copy(defaultBarcodeScannerOptions[value]));
        return;
      }

      emit('update:barcode', { ...props.barcode, [field]: value });
    };

    return { barcodes, readers, update };
  },
});
</script>

<style lang="scss" scoped></style>
