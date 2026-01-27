<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.display.mobile"
    :max-width="$vuetify.display.mobile ? undefined : '640px'"
    :min-height="$vuetify.display.mobile ? undefined : '480px'"
  >
    <v-card ref="card" :tile="$vuetify.display.mobile">
      <v-toolbar color="secondary">
        <v-btn icon="$close" :title="$t('common.action.close')" @click.stop="close" />
        <v-toolbar-title>Scan barcode</v-toolbar-title>
        <v-spacer />
        <v-switch v-model="locate" class="mt-0" hide-details name="locate">
          <template #label>
            <v-icon>fas fa-crosshairs</v-icon>
          </template>
        </v-switch>
        <v-divider class="ms-2" vertical />
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
      <div ref="reader" class="barcode-reader">
        <canvas class="drawingBuffer" />
        <video :style="{ height: `${height - 56}px` }" />
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { QuaggaJSResultObject } from '@ericblade/quagga2';
import type { PropType } from 'vue';

import type { QuaggaScanner } from '@intake24/common/barcodes';

import Quagga from '@ericblade/quagga2';
import { useElementSize, useVModel, watchDebounced } from '@vueuse/core';
import { defineComponent, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';

import { defaultBarcodeScannerOptions } from '@intake24/common/barcodes';

import { useMessages } from '../../stores';
import { useTorch } from '../util';

const props = defineProps({
  dialog: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Object as PropType<QuaggaScanner>,
    default: () => defaultBarcodeScannerOptions.quagga,
  },
  errorThreshold: {
    type: Number,
    default: 0.2,
  },
  successfulReads: {
    type: Number,
    default: 3,
  },
});

const emit = defineEmits<{
  (e: 'detected', barcode: string): void;
  (e: 'update:dialog', value: boolean): void;
}>();

const { hasTorch, initTorch, toggleTorch } = useTorch();

const dialog = useVModel(props, 'dialog', emit);

const card = useTemplateRef('card');
const reader = useTemplateRef('reader');

const { height, width } = useElementSize(card);

const initializing = ref(false);
const results = ref<QuaggaJSResultObject[]>([]);
const locate = ref(true);

function drawScanBox() {
  const ctx = Quagga.canvas.ctx.overlay;
  const canvas = Quagga.canvas.dom.overlay;
  if (!canvas || !ctx)
    return;

  const canvasWidth = Number.parseInt(canvas.getAttribute('width') ?? '0');
  const canvasHeight = Number.parseInt(canvas.getAttribute('height') ?? '0');

  const boxHeight = canvasHeight * 0.3;
  const boxWidth = canvasWidth * 0.8;

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FAFAFA';
  ctx.rect(canvasWidth * 0.1, canvasHeight / 2 - boxHeight / 2, boxWidth, boxHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#EEEEEE';
  ctx.moveTo(canvasWidth * 0.15, canvasHeight * 0.5);
  ctx.lineTo(canvasWidth * 0.85, canvasHeight * 0.5);
  ctx.stroke();
}

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(
    0,
    0,
    Number.parseInt(canvas.getAttribute('width') ?? '0'),
    Number.parseInt(canvas.getAttribute('height') ?? '0'),
  );
}

function drawResult(result: QuaggaJSResultObject) {
  const ctx = Quagga.canvas.ctx.overlay;
  const canvas = Quagga.canvas.dom.overlay;
  if (!canvas || !ctx)
    return;

  if (result.boxes.length) {
    clearCanvas(ctx, canvas);

    result.boxes
      .filter(box => box !== result.box)
      .forEach((box) => {
        Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, ctx, { color: '#FAFAFA', lineWidth: 2 });
      });
  }

  if (result.box.length) {
    Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, ctx, {
      color: '#EEEEEE',
      lineWidth: 2,
    });
  }
}

function getMedian(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1)
    return sorted[half];

  return (sorted[half - 1] + sorted[half]) / 2;
}

function getMedianOfCodeErrors(codes: QuaggaJSResultObject['codeResult']['decodedCodes']) {
  const errors = codes
    .filter(({ error }) => error !== undefined)
    .map(({ error }) => error) as number[];

  return getMedian(errors);
}

async function stop() {
  // Quagga.offProcessed();
  Quagga.offDetected();
  await Quagga.stop();
}

function close() {
  emit('update:dialog', false);
}

async function start() {
  if (initializing.value)
    return;

  initializing.value = true;
  await stop();
  results.value = [];

  if (!reader.value)
    return;

  await Quagga.init(
    {
      inputStream: {
        type: 'LiveStream',
        target: reader.value,
        constraints: {
          facingMode: 'environment',
          height: { min: 480, ideal: 720 },
          width: { min: 640, ideal: 1280 },
        },
        area: locate.value ? undefined : { top: '45%', right: '0%', left: '0%', bottom: '45%' },
        willReadFrequently: true,
      },
      locate: locate.value,
      decoder: {
        readers: props.options.readers,
      },
    },
    async (err) => {
      if (err) {
        console.warn(err);
        useMessages().warning('Could not find suitable camera.');
        return;
      }

      // Quagga.onProcessed(this.onProcessed);
      Quagga.onDetected(onDetected);
      await initTorch();

      if (!locate.value)
        drawScanBox();

      console.log('Initialization finished. Ready to start');
      Quagga.start();
      initializing.value = false;
    },
  );
}

watch(locate, async () => {
  await start();
});

watch(
  () => props.dialog,
  async (val) => {
    if (val)
      await start();
    else await stop();
  },
);

watchDebounced(
  [height, width],
  async () => {
    if (!props.dialog)
      return;

    await start();
  },
  { debounce: 500, maxWait: 2000 },
);

onBeforeUnmount(async () => {
  await stop();
});

/* onProcessed(result: QuaggaJSResultObject) {}, */

function onDetected(result: QuaggaJSResultObject) {
  const err = getMedianOfCodeErrors(result.codeResult.decodedCodes);

  if (err > props.errorThreshold)
    return;

  if (locate.value)
    drawResult(result);

  results.value.push(result);
  checkResults();
}

function checkResults() {
  if (results.value.length < props.successfulReads)
    return;

  const occurrences = results.value.reduce<Record<string, number>>((acc, curr) => {
    const { code } = curr.codeResult;
    if (!code)
      return acc;

    if (acc[code])
      ++acc[code];
    else
      acc[code] = 1;

    return acc;
  }, {});

  const match = Object.entries(occurrences).find(([code, count]) => count >= props.successfulReads);
  if (!match)
    return;

  successfulRead(match[0]);
}

function successfulRead(barcode: string) {
  if (props.options.feedback.vibration)
    navigator.vibrate(200);

  toggleTorch(false);
  emit('detected', barcode);
  close();
}
</script>

<script lang="ts">
export default defineComponent({
  name: 'QuaggaReader',
});
</script>

<style lang="scss" scoped>
.barcode-reader {
  position: relative;
  min-height: 480px;

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  video {
    display: block;
    width: 100%;
    object-fit: cover;
  }
}
</style>
