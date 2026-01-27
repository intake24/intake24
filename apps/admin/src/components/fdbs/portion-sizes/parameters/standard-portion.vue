<template>
  <v-row>
    <v-col class="d-flex flex-column" cols="12">
      <v-btn
        v-if="!readonly"
        class="mb-4 align-self-end"
        color="secondary"
        rounded
        :title="$t('standard-units.add')"
        variant="outlined"
        @click="add"
      >
        <v-icon icon="$add" start />
        {{ $t('standard-units.add') }}
      </v-btn>
      <v-table>
        <thead>
          <tr>
            <th />
            <th>{{ $t('fdbs.portionSizes.methods.standard-portion.unit') }}</th>
            <th>{{ $t('fdbs.portionSizes.methods.standard-portion.weight') }}</th>
            <th>{{ $t('fdbs.portionSizes.methods.standard-portion.omitFoodDescription') }}</th>
            <th />
          </tr>
        </thead>
        <vue-draggable
          v-model="parameters.units"
          :animation="300"
          :disabled="readonly"
          handle=".drag-and-drop__handle"
          tag="tbody"
        >
          <tr v-for="(unit, idx) in parameters.units" :key="unit.name">
            <td>
              <v-icon class="drag-and-drop__handle">
                $handle
              </v-icon>
            </td>
            <td>
              <select-resource v-model="unit.name" :readonly resource="standard-units">
                <template #activator="{ props }">
                  <v-btn v-bind="props" :readonly :title="$t('standard-units.add')" variant="text">
                    <v-icon icon="$standard-units" start />
                    {{ unit.name }}
                  </v-btn>
                </template>
              </select-resource>
            </td>
            <td>
              <v-text-field
                v-model.number="unit.weight"
                density="compact"
                :name="`unit${idx}-weight`"
                :rules="weightRules"
              />
            </td>
            <td>
              <v-switch
                v-model="unit.omitFoodDescription"
                class="mt-0"
              />
            </td>
            <td>
              <confirm-dialog
                v-if="!readonly"
                color="error"
                icon
                icon-left="$delete"
                :label="$t('standard-units.remove')"
                size="small"
                variant="text"
                @confirm="remove(idx)"
              >
                {{ $t('common.action.confirm.delete', { name: unit.name }) }}
              </confirm-dialog>
            </td>
          </tr>
        </vue-draggable>
      </v-table>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PortionSizeParameters } from '@intake24/common/surveys';

import { VueDraggable } from 'vue-draggable-plus';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { ConfirmDialog } from '@intake24/ui';

import { useParameters } from './use-parameters';

defineOptions({ name: 'StandardPortionParameters' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<PortionSizeParameters['standard-portion']>,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { parameters } = useParameters<'standard-portion'>(props, { emit });

function add() {
  parameters.value.units.push({
    name: `unit-${parameters.value.units.length + 1}`,
    weight: 1,
    omitFoodDescription: false,
  });
}

function remove(index: number) {
  parameters.value.units.splice(index, 1);
}

const weightRules = [
  (value: any): boolean | string => {
    const msg = 'Value must be greater than 0';
    const number = Number.parseFloat(value);
    if (Number.isNaN(number))
      return msg;

    return number > 0 || msg;
  },
];
</script>
