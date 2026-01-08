<template>
  <v-card flat>
    <v-card-title>{{ $t('drinkware-sets.volumeTable.title') }}</v-card-title>
    <v-card-subtitle v-if="legacyWarning" class="mt-0">
      <v-alert type="info">
        <p>
          {{ $t('drinkware-sets.volumeTable.legacy.p1') }}
        </p>
        <p>
          {{ $t('drinkware-sets.volumeTable.legacy.p2') }}
        </p>
      </v-alert>
    </v-card-subtitle>
    <v-card-actions>
      <v-btn @click="onAddRow">
        <v-icon icon="fas fa-plus" start />
      </v-btn>
      <v-btn @click="onRemoveLastRow">
        <v-icon icon="fas fa-trash" start />{{ $t('drinkware-sets.volumeTable.removeRow') }}
      </v-btn>
      <v-btn :disabled="pasteDisabled" @click="onPasteData">
        <v-icon icon="fas fa-clipboard" start />{{ $t('drinkware-sets.volumeTable.paste') }}
      </v-btn>
    </v-card-actions>
    <v-card-text>
      <v-table>
        <thead>
          <tr>
            <th class="text-left">
              {{ $t('drinkware-sets.volumeTable.heightLabel') }}
            </th>
            <th class="text-left">
              {{ $t('drinkware-sets.volumeTable.volumeLabel') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_, index) in volumeSampleRows" :key="index">
            <td>
              <v-text-field
                v-model="volumeSampleRows[index][0]"
                bg-color="#0000"
                density="compact"
                flat
                hide-details
                variant="solo"
                @change="onDataChanged"
              />
            </td>
            <td>
              <v-text-field
                v-model="volumeSampleRows[index][1]"
                bg-color="#0000"
                density="compact"
                flat
                hide-details
                variant="solo"
                @change="onDataChanged"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { chunk, flatten } from 'lodash-es';
import { computed, defineComponent, ref, watch } from 'vue';
import { useEntry as useStoreEntry } from '@intake24/admin/stores';
import type { DrinkwareSetEntry } from '@intake24/common/types/http/admin';

export default defineComponent({
  name: 'VolumeSamplesTable',

  props: {
    scaleIndex: {
      type: Number,
      required: true,
    },
  },

  emits: ['confirm', 'select'],

  setup(props, { emit }) {
    const _confirm = () => {
      emit('confirm');
    };

    const entryStore = useStoreEntry();

    const entrySamples = computed(() => {
      const entry = entryStore.getEntry as DrinkwareSetEntry;
      const scale = entry.scales[props.scaleIndex];

      return chunk(
        scale.volumeSamples.map(v => v.toString()),
        2,
      );
    });

    const legacyWarning = computed(() => {
      return (
        entrySamples.value.length > 0
        && entrySamples.value.some(s => Number.parseFloat(s[0]) > 0)
        && !entrySamples.value.some(s => Number.parseFloat(s[0]) > 1)
      );
    });

    const volumeSampleRows = ref([...entrySamples.value]);

    const onDataChanged = () => {
      const entry = entryStore.getEntry as DrinkwareSetEntry;
      const scales = [...entry.scales];

      scales[props.scaleIndex].volumeSamples = flatten(
        volumeSampleRows.value.map(([height, volume]) => [Number.parseFloat(height), Number.parseFloat(volume)]),
      );

      entryStore.updateEntry({
        ...entry,
        scales,
      });
    };

    const onAddRow = () => {
      const rowIndex = volumeSampleRows.value.length;

      volumeSampleRows.value.push(
        rowIndex < entrySamples.value.length ? entrySamples.value[rowIndex] : ['0', '0'],
      );
      onDataChanged();
    };

    const onRemoveLastRow = () => {
      volumeSampleRows.value.pop();
      onDataChanged();
    };

    const onPasteData = async () => {
      const items = await navigator.clipboard.read();

      for (const i of items)
        console.log(i.types);
    };

    const pasteDisabled = !navigator.clipboard;

    watch(entrySamples, (value) => {
      volumeSampleRows.value = value;
    });

    return {
      volumeSampleRows,
      onAddRow,
      onRemoveLastRow,
      onPasteData,
      onDataChanged,
      pasteDisabled,
      legacyWarning,
    };
  },
});
</script>
