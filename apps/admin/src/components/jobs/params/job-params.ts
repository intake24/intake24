import type { PropType } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables/use-errors';

import { defineComponent } from 'vue';

export default <T>() =>
  defineComponent({
    name: 'JobParams',

    props: {
      errors: {
        type: Object as PropType<ReturnUseErrors>,
        required: true,
      },
      modelValue: {
        type: Object as PropType<T>,
        required: true,
      },
      disabled: {
        type: Object as PropType<Record<keyof T, boolean>>,
        default: () => ({}),
      },
    },

    emits: ['update:modelValue'],

    computed: {
      params: {
        get() {
          return this.modelValue;
        },
        set(value: T) {
          this.$emit('update:modelValue', value);
        },
      },
    },
  });
