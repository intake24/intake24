<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('fdbs.nutrients.title') }}
      </v-toolbar-title>
      <v-spacer />
      <add-nutrient-dialog
        v-if="!readonly"
        :current-items="items"
        :nutrient-tables="nutrientTables"
        @add="add"
      />
    </v-toolbar>
    <v-list class="list-border py-0" lines="two">
      <v-list-item v-for="item in items" :key="item.id" link>
        <template #prepend>
          <v-icon>$nutrient-types</v-icon>
        </template>
        <v-list-item-title>
          {{ getNutrientTableName(item.nutrientTableId) }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ $t('common.id') }}: {{ item.nutrientTableRecordId }} | {{ $t('common.name') }}:
          {{ item.name }}
        </v-list-item-subtitle>
        <template #append>
          <v-list-item-action v-if="!readonly">
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('fdbs.nutrients.remove')"
              @confirm="remove(item.id)"
            >
              {{ $t('common.action.confirm.remove', { name: item.name }) }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
    <error-list
      v-if="errors?.has('nutrientRecords')"
      class="px-4 pb-2"
      :errors="errors.get('nutrientRecords')"
    />
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { ReturnUseErrors } from '@intake24/admin/composables/use-errors';
import type { FoodDatabaseRefs, NutrientTableRecordAttributes } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { ConfirmDialog, useI18n } from '@intake24/ui';

import { ErrorList } from '../../forms';
import AddNutrientDialog from './add-nutrient-dialog.vue';

export default defineComponent({
  name: 'NutrientList',

  components: { AddNutrientDialog, ConfirmDialog, ErrorList },

  props: {
    errors: {
      type: Object as PropType<ReturnUseErrors>,
      required: true,
    },
    nutrientTables: {
      type: Array as PropType<FoodDatabaseRefs['nutrientTables']>,
      default: () => [],
    },
    modelValue: {
      type: Array as PropType<NutrientTableRecordAttributes[]>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const { i18n } = useI18n();

    const items = computed({
      get() {
        return props.modelValue;
      },
      set(val) {
        emit('update:modelValue', val);
      },
    });

    const add = (item: NutrientTableRecordAttributes) => {
      items.value.push(item);
    };

    const remove = (id: string) => {
      items.value = items.value.filter(item => item.id !== id);
    };

    const getNutrientTableName = (id: string) => {
      const table = props.nutrientTables.find(item => item.id === id);

      return table?.description ?? i18n.t('common.not.found');
    };

    return { add, getNutrientTableName, items, remove };
  },
});
</script>
