<template>
  <div class="d-flex flex-column align-center ga-2">
    <v-btn-toggle
      v-if="prompt.amPmToggle"
      v-model="activeFormat"
      color="primary"
      density="compact"
      rounded="pill"
      variant="tonal"
    >
      <v-btn value="24hr">
        {{ promptI18n['picker.24h'] }}
      </v-btn>
      <v-btn value="ampm">
        {{ promptI18n['picker.amPm'] }}
      </v-btn>
    </v-btn-toggle>
    <div class="d-flex flex-row justify-center ga-4">
      <div class="d-flex flex-row justify-center ga-1">
        <div class="d-flex flex-column align-center gr-2">
          <v-btn
            icon
            plain
            :size="60"
            @click="updateTime('hours', 1)"
          >
            <v-icon icon="fas fa-chevron-up" size="45" />
          </v-btn>
          <v-btn
            class="time-element rounded-lg"
            color="grey-lighten-2"
            size="90"
            @click="openModal('hours')"
          >
            {{ isAmPm ? hoursToAmPm(time.hours) : padLabel(time.hours) }}
          </v-btn>
          <v-btn
            icon
            plain
            :size="60"
            @click="updateTime('hours', -1)"
          >
            <v-icon icon="fas fa-chevron-down" size="45" />
          </v-btn>
        </div>
        <div class="time-element d-flex align-center">
          <span :style="{ height: '90px' }">:</span>
        </div>
        <div class="d-flex flex-column align-center gr-2">
          <v-btn
            icon
            plain
            :size="60"
            @click="updateTime('minutes', 1)"
          >
            <v-icon icon="fas fa-chevron-up" size="45" />
          </v-btn>
          <v-btn
            class="time-element rounded-lg"
            color="grey-lighten-2"
            size="90"
            @click="openModal('minutes')"
          >
            {{ padLabel(time.minutes) }}
          </v-btn>
          <v-btn
            icon
            plain
            :size="60"
            @click="updateTime('minutes', -1)"
          >
            <v-icon icon="fas fa-chevron-down" size="45" />
          </v-btn>
        </div>
        <v-dialog
          v-model="modal"
          max-width="360"
        >
          <v-card>
            <v-card-title class="text-center justify-center text-h1">
              <h2 class="font-weight-medium text-h2 text-uppercase">
                {{ promptI18n['picker.title'] }}
              </h2>
            </v-card-title>
            <v-tabs v-model="tab" grow>
              <v-tab key="hours" value="hours">
                {{ promptI18n['picker.hours'] }}
              </v-tab>
              <v-tab key="minutes" value="minutes">
                {{ promptI18n['picker.minutes'] }}
              </v-tab>
            </v-tabs>
            <v-tabs-window v-model="tab">
              <v-tabs-window-item value="hours">
                <v-container>
                  <v-row>
                    <v-col>
                      <v-btn
                        v-for="(item, index) in selection.hours"
                        :key="index"
                        class="ma-2 pa-2"
                        :color="time.hours === item ? 'primary' : 'grey-lighten-2'"
                        :icon="!isAmPm"
                        :rounded="isAmPm ? 'pill' : 'circle'"
                        @click="setTime('hours', item)"
                      >
                        {{ isAmPm ? amPmHours[item] : padLabel(item) }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>
              <v-tabs-window-item value="minutes">
                <v-container>
                  <v-row>
                    <v-col cols="auto">
                      <v-btn
                        v-for="(item, index) in selection.minutes"
                        :key="index"
                        class="ma-2"
                        :color="time.minutes === item ? 'primary' : 'grey-lighten-2'"
                        icon
                        rounded="circle"
                        @click="setTime('minutes', item)"
                      >
                        {{ padLabel(item) }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card>
        </v-dialog>
      </div>
      <div v-if="isAmPm" class="d-flex flex-column align-center justify-center gr-2">
        <v-btn
          class="am-pm-element rounded-lg px-2"
          color="grey-lighten-2"
          readonly
          size="90"
        >
          {{ promptI18n[`picker.${time.hours < 12 ? 'am' : 'pm'}`] }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed, ref, watch } from 'vue';
import type { Prompts } from '@intake24/common/prompts';
import { fromTime, toTime } from '@intake24/common/util';
import { usePromptUtils } from '@intake24/survey/composables';

const props = defineProps({
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
  prompt: {
    type: Object as PropType<Prompts['meal-time-prompt' | 'time-picker-prompt']>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue']);

const { translatePrompt } = usePromptUtils(props, { emit });

const promptI18n = computed(() => translatePrompt([
  'picker.title',
  'picker.hours',
  'picker.minutes',
  'picker.24h',
  'picker.amPm',
  'picker.am',
  'picker.pm',
]));

const time = ref(toTime(props.modelValue ?? '00:00'));
const activeFormat = ref(props.prompt.format ?? '24hr');
const isAmPm = computed(() => activeFormat.value === 'ampm');

const allowedMinutes = computed(
  () => (minutes: number) => minutes % props.prompt.allowedMinutes === 0,
);

const modal = ref(false);
const tab = ref<'hours' | 'minutes'>('hours');
function openModal(el: 'hours' | 'minutes') {
  modal.value = true;
  tab.value = el;
}

const selection = computed(() => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return {
    hours,
    minutes: minutes.filter(allowedMinutes.value),
  };
});
function hoursToAmPm(hours: number, withAmPm = false) {
  if (!withAmPm)
    return `${hours <= 12 ? hours : hours - 12}`;

  return `${hours <= 12 ? hours : hours - 12} ${promptI18n.value[`picker.${hours < 12 ? 'am' : 'pm'}`]}`;
}
const amPmHours = computed(() => selection.value.hours.map(hour => hoursToAmPm(hour, true)));

function padLabel(val: number) {
  return val.toString().padStart(2, '0');
}

function setTime(el: 'hours' | 'minutes', val: number) {
  const items = selection.value[el];
  const index = items.indexOf(time.value[el]);
  if (index === -1)
    return;

  time.value[el] = val;

  if (el === 'hours')
    tab.value = 'minutes';
  else
    modal.value = false;
}

function updateTime(el: 'hours' | 'minutes', val: number) {
  const items = selection.value[el];
  const index = items.indexOf(time.value[el]);

  if (index === -1)
    return;

  const newIndex = index + val;

  if (newIndex < 0) {
    time.value[el] = items[items.length - 1];

    if (el === 'minutes')
      updateTime('hours', -1);

    return;
  }

  if (newIndex >= items.length) {
    time.value[el] = items[0];

    if (el === 'minutes')
      updateTime('hours', 1);

    return;
  }

  time.value[el] = items[newIndex];
}

watch(time, (val) => {
  const time = fromTime(val);
  emit('update:modelValue', time);
}, { deep: true });
</script>

<style lang="scss">
.time-element {
  font-size: 56px;
}
.am-pm-element {
  font-size: 40px;
}
</style>
