<template>
  <v-expand-transition>
    <v-sheet v-show="contextId === entity?.id" class="meal-list-mobile__context" color="ternary">
      <div class="d-flex flex-row justify-center pa-4 ga-4">
        <v-card
          v-for="(item, idx) in menu"
          :key="idx"
          class="rounded-xl"
          link
          tile
          @click="item.dialog ? openDialog(item.action) : action(item.action)"
        >
          <v-card-text class="d-flex flex-column justify-center align-center ga-2">
            <v-icon size="large">
              {{ item.icon }}
            </v-icon>
            <span class="text-center font-weight-medium">{{ item.name }}</span>
          </v-card-text>
        </v-card>
      </div>
      <confirm-dialog
        v-model="dialog"
        external
        :label="$t(`recall.menu.${isMeal ? 'meal' : 'food'}.delete`)"
        @confirm="action(isMeal ? 'deleteMeal' : 'deleteFood')"
      >
        <i18n-t :keypath="`recall.menu.${isMeal ? 'meal' : 'food'}.deleteConfirm`" tag="span">
          <template #item>
            <span class="font-weight-medium">{{ entityName }}</span>
          </template>
        </i18n-t>
      </confirm-dialog>
    </v-sheet>
  </v-expand-transition>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { MenuItem } from '../use-food-item';
import type { FoodState, MealState } from '@intake24/common/surveys';

import { defineComponent } from 'vue';

import { ConfirmDialog } from '@intake24/ui';

import { useContextMenu } from '../use-context-menu';

export default defineComponent({
  name: 'ContextMenu',

  components: { ConfirmDialog },

  props: {
    contextId: {
      type: String,
    },
    food: {
      type: Object as PropType<FoodState>,
    },
    meal: {
      type: Object as PropType<MealState>,
      required: true,
    },
    menu: {
      type: Array as PropType<MenuItem[]>,
      required: true,
    },
  },

  emits: ['action'],

  setup(props, ctx) {
    const { action, dialog, entity, entityName, isMeal, openDialog } = useContextMenu(props, ctx);

    return {
      action,
      dialog,
      entity,
      entityName,
      isMeal,
      openDialog,
    };
  },
});
</script>
