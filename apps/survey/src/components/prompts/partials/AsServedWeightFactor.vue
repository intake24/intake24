<template>
  <v-overlay
    absolute
    class="align-center justify-center"
    contained
    :model-value="show"
    :opacity="0.2"
    persistent
    scroll-strategy="none"
  >
    <v-card class="card-overlay" flat :tile="$vuetify.display.mobile">
      <v-card-text class="d-flex flex-column align-center">
        <v-btn
          v-if="!$vuetify.display.mobile"
          class="mb-3"
          color="secondary"
          :disabled="numerator === maxNumerator"
          icon
          size="large"
          :title="$t(`prompts.asServed.${type}.more`)"
          variant="outlined"
          @click="update(1)"
        >
          <v-icon aria-hidden="false">
            $increment
          </v-icon>
        </v-btn>
        <v-chip>
          <i18n-t
            class="font-weight-medium text-h6"
            :keypath="`prompts.asServed.weightFactor.${type}.${subType}`"
            tag="span"
          >
            <template #whole>
              <span class="font-weight-bold">{{ whole }}</span>
            </template>
            <template #fraction>
              <span class="font-weight-bold">{{ fraction }}</span>
            </template>
          </i18n-t>
        </v-chip>
        <span class="my-1 font-weight-medium text-h6">
          {{ $t(`prompts.asServed.weightFactor.${subType}`) }}
        </span>
        <span class="mb-3 font-weight-medium text-h6">
          (<span class="font-weight-bold">{{ amount }}g</span>)
        </span>
        <div>
          <v-btn
            color="secondary"
            :disabled="numerator === minNumerator"
            icon
            size="large"
            :title="$t(`prompts.asServed.${type}.less`)"
            variant="outlined"
            @click="update(-1)"
          >
            <v-icon aria-hidden="false">
              $decrement
            </v-icon>
          </v-btn>
          <v-btn
            v-if="$vuetify.display.mobile"
            class="ms-6"
            color="secondary"
            :disabled="numerator === maxNumerator"
            icon
            size="large"
            :title="$t(`prompts.asServed.${type}.more`)"
            variant="outlined"
            @click="update(1)"
          >
            <v-icon aria-hidden="false">
              $increment
            </v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-overlay>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

export type WeightFactorProps = {
  show: boolean;
  type: 'serving' | 'leftovers';
  subType: 'less' | 'more';
  minNumerator: number;
  maxNumerator: number;
  denominator: number;
  weight: number;
  modelValue: number;
};

export default defineComponent({
  name: 'AsServedWeightFactor',

  props: {
    show: {
      type: Boolean as PropType<WeightFactorProps['show']>,
      required: true,
    },
    denominator: {
      type: Number as PropType<WeightFactorProps['denominator']>,
      required: true,
    },
    minNumerator: {
      type: Number as PropType<WeightFactorProps['minNumerator']>,
      required: true,
    },
    maxNumerator: {
      type: Number as PropType<WeightFactorProps['maxNumerator']>,
      required: true,
    },
    type: {
      type: String as PropType<WeightFactorProps['type']>,
      required: true,
    },
    subType: {
      type: String as PropType<WeightFactorProps['subType']>,
      required: true,
    },
    weight: {
      type: Number as PropType<WeightFactorProps['weight']>,
      required: true,
    },
    modelValue: {
      type: Number as PropType<WeightFactorProps['modelValue']>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      numerator: this.modelValue,
    };
  },

  computed: {
    amount() {
      return ((this.numerator / this.denominator) * this.weight).toFixed(2);
    },
    whole() {
      return Math.floor(this.numerator / this.denominator);
    },
    fraction(): string {
      const fraction = this.numerator / this.denominator - this.whole;

      switch (fraction) {
        case 0.25:
          return '¼';
        case 0.5:
          return '½';
        case 0.75:
          return '¾';
        default:
          return fraction.toString();
      }
    },
  },

  watch: {
    show(val: boolean) {
      if (!val)
        return;

      this.numerator = this.modelValue;
    },
  },

  methods: {
    update(value: number) {
      this.numerator
        = value > 0
          ? Math.min(this.maxNumerator, this.numerator + value)
          : Math.max(this.minNumerator, this.numerator + value);

      this.$emit('update:modelValue', this.numerator);
    },
  },
});
</script>

<style lang="scss" scoped>
.card-overlay {
  background-color: rgb(white, 0.8);
}
</style>
