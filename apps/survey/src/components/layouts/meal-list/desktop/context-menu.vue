<template>
  <div>
    <v-menu :close-delay="250" close-on-content-click open-on-hover :persistent="false">
      <template #activator="{ props: cmProps }">
        <v-icon v-bind="cmProps" size="small" @click.stop>
          $edit
        </v-icon>
      </template>
      <v-list density="compact">
        <template v-for="(item, idx) in menu" :key="item.name">
          <v-list-item
            @click="item.dialog ? openDialog(item.action) : action(item.action)"
          >
            <template v-if="item.icon" #prepend>
              <v-icon :icon="item.icon" size="small" />
            </template>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
          <v-divider v-if="idx + 1 < menu.length" :key="`div-${item.name}`" />
        </template>
      </v-list>
    </v-menu>
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
  </div>
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
