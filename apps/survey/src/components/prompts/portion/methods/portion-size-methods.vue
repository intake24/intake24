<template>
  <v-item-group
    v-if="portionSizeMethods.length"
    v-model="selected"
    :mandatory="selected !== null"
  >
    <v-container>
      <v-row>
        <v-col
          v-for="(availableMethod) in portionSizeMethods"
          :key="availableMethod.index"
          cols="12"
          md="4"
          sm="6"
        >
          <v-item v-slot="{ isSelected, toggle }" :value="availableMethod.index">
            <v-card
              border
              border-color="secondary"
              class="d-flex flex-column justify-space-between"
              :elevation="isSelected ? '4' : undefined"
              height="100%"
              hover
              @click="toggle"
            >
              <component :is="`${availableMethod.method}-method`" :method="availableMethod" />
              <v-card-actions
                class="d-flex justify-end"
                :class="{ 'bg-grey-lighten-4': !isSelected, 'bg-ternary': isSelected }"
              >
                <v-chip
                  class="font-weight-medium px-4 chip-truncate"
                  :color="selected === availableMethod.index ? 'info' : 'primary'"
                  variant="flat"
                >
                  {{ $t(`prompts.portionSizeOption.selections.${availableMethod.description}`) }}
                </v-chip>
              </v-card-actions>
            </v-card>
          </v-item>
        </v-col>
      </v-row>
    </v-container>
  </v-item-group>
  <v-card-text v-else>
    <v-alert border="start" type="warning" variant="outlined">
      {{ $t('prompts.portionSizeOption.unknown', { food: foodName }) }}
    </v-alert>
  </v-card-text>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods';

import PortionIcon from './icon.vue';
import PortionImage from './image.vue';
import PortionOptions from './options.vue';
import StandardUnits from './standard-units.vue';

defineOptions({
  name: 'PortionSizeMethods',
  components: {
    'as-served-method': PortionImage,
    'cereal-method': PortionImage,
    'direct-weight-method': PortionImage,
    'drink-scale-method': PortionImage,
    'guide-image-method': PortionImage,
    'milk-on-cereal-method': PortionImage,
    'milk-in-a-hot-drink-method': PortionOptions,
    'parent-food-portion-method': PortionOptions,
    'pizza-method': PortionImage,
    'pizzaV2-method': PortionImage,
    'standard-portion-method': StandardUnits,
    'unknown-method': PortionIcon,
  },
});

defineProps({
  foodName: {
    type: String as PropType<string>,
    required: true,
  },
  portionSizeMethods: {
    type: Array as PropType<(UserPortionSizeMethod & { index: number })[]>,
    required: true,
  },
});

defineEmits(['action', 'update:modelValue']);

const selected = defineModel('modelValue', { type: Number as PropType<number | null>, default: null });
</script>

<style lang="scss" scoped></style>
