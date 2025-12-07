<template>
  <v-dialog
    v-model="dialog"
    eager
    :fullscreen="$vuetify.display.mobile"
    :max-width="$vuetify.display.mobile ? undefined : '640px'"
    :min-height="$vuetify.display.mobile ? undefined : '480px'"
  >
    <v-card ref="card" :tile="$vuetify.display.mobile">
      <v-toolbar color="secondary">
        <v-btn icon="$close" :title="$t('common.action.close')" @click.stop="close" />
        <v-toolbar-title>Scan barcode</v-toolbar-title>
        <v-spacer />
        <v-btn
          color="white"
          :disabled="!hasTorch"
          icon
          title="Torch"
          @click="toggleTorch"
        >
          <v-icon>fas fa-lightbulb</v-icon>
        </v-btn>
      </v-toolbar>
      <div ref="reader" class="barcode-reader" :style="{ height: `${height - 56}px` }" />
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { BarcodeReader, StrichSDK } from '@pixelverse/strichjs-sdk';
import { useElementSize, useVModel, watchDebounced } from '@vueuse/core';
import { defineComponent, onBeforeMount, onBeforeUnmount, useTemplateRef, watch } from 'vue';

import { defaultBarcodeScannerOptions } from '@intake24/common/barcodes';
import type { StrichScanner } from '@intake24/common/barcodes';

import { useTorch } from '../util';

const props = defineProps({
  dialog: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Object as PropType<StrichScanner>,
    default: () => defaultBarcodeScannerOptions.strich,
  },
});

const emit = defineEmits<{
  (e: 'detected', value: string): void;
  (e: 'update:dialog', value: boolean): void;
}>();

const { hasTorch, initTorch, toggleTorch } = useTorch();

const dialog = useVModel(props, 'dialog', emit);

const card = useTemplateRef('card');
const reader = useTemplateRef('reader');

const { height, width } = useElementSize(card);

let barcodeReader: BarcodeReader | undefined;

async function start() {
  if (!barcodeReader)
    await initReader();

  await barcodeReader?.start();
}
async function stop() {
  await barcodeReader?.stop();
}

async function destroy() {
  await stop();
  barcodeReader?.destroy();
  barcodeReader = undefined;
}

async function initSDK() {
  if (StrichSDK.isInitialized())
    return true;

  const key = import.meta.env.VITE_STRICH_KEY;
  if (!key)
    return false;

  try {
    await StrichSDK.initialize(key);
    console.debug('StrichSDK initialized');
  }
  catch (e) {
    return false;
  }
}

async function initReader() {
  if (!reader.value)
    return;

  try {
    barcodeReader = new BarcodeReader({
      selector: reader.value,
      engine: {
        symbologies: props.options.readers,
      },
      locator: {
        regionOfInterest: {
          left: 0.05,
          right: 0.05,
          top: 0.35,
          bottom: 0.35,
        },
      },
      feedback: {
        audio: false,
        vibration: props.options.feedback.vibration,
      },
      overlay: {
        showFlashlight: false,
      },
    });
    await barcodeReader.initialize();
    barcodeReader.detected = (codeDetections) => {
      const barcode = codeDetections[0].data;
      if (!barcode)
        return;

      toggleTorch(false).catch((error) => {
        console.error('Error turning off torch after detection', error);
      });
      emit('detected', barcode);
      close();
    };
    barcodeReader.onError = (err) => {
      console.warn(err);
    };

    await barcodeReader.start();
    await initTorch();
  }
  catch (err) {
    // internal Strich errors
  }
}

function close() {
  emit('update:dialog', false);
}

onBeforeMount(async () => {
  await initSDK();
});

onBeforeUnmount(async () => {
  await destroy();
});

watch(
  () => props.dialog,
  async (val) => {
    if (!val)
      await destroy();
  },
);

watchDebounced(
  [height, width],
  async (val) => {
    if (!props.dialog || !val[0] || !val[1])
      return;

    await start();
  },
  { debounce: 500, maxWait: 2000 },
);
</script>

<script lang="ts">
export default defineComponent({
  name: 'StrichReader',
});
</script>

<style lang="scss" scoped>
.barcode-reader {
  position: relative;
  background-color: black;
  min-height: 480px;
  height: 100%;
}
</style>
