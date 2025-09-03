<template>
  <teleport
    v-if="$vuetify.display.mobile"
    to="#app-mobile-navigation .v-bottom-navigation__content"
  >
    <v-btn
      class="order-2 btn-review"
      :disabled="disabled"
      :ripple="false"
      stacked
      :title="$t('common.nav.review')"
      value="recall"
      variant="text"
      @click="toggleDrawer"
    >
      <div v-ripple class="btn-review__wrapper">
        <div class="btn-review__content">
          <v-icon icon="fas fa-list-check" />
          <span>{{ $t('common.nav.review') }}</span>
        </div>
      </div>
    </v-btn>
  </teleport>
  <v-bottom-sheet v-model="drawer" content-class="meal-list-mobile__sheet" scrollable>
    <v-card class="meal-list-mobile__card">
      <div class="py-4 ps-4 pe-3 d-flex flex-row justify-space-between align-center">
        <div class="text-h6 font-weight-medium">
          {{ $t('recall.menu.title') }}
        </div>
        <v-btn color="white" icon :title="$t('recall.menu.meal.add')" @click="action('addMeal')">
          <v-icon color="primary" icon="$add" size="x-large" />
        </v-btn>
      </div>
      <v-list class="meal-list__list pa-0" density="compact">
        <meal-item
          v-for="meal in meals"
          :key="meal.id"
          v-bind="{ contextId, meal, selectedMealId, selectedFoodId }"
          :selected-food-in-meal="isSelectedFoodInMeal(meal.id)"
          @action="action"
          @update:context-id="updateContextId"
        />
      </v-list>
      <v-btn
        block
        color="info"
        size="large"
        tile
        :title="$t('common.action.close')"
        @click="closeDrawer"
      >
        <v-icon icon="$close" start />
        {{ $t('common.action.close') }}
      </v-btn>
    </v-card>
  </v-bottom-sheet>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref, watch } from 'vue';
import type { MealState } from '@intake24/common/surveys';
import { useMealList } from '../use-meal-list';
import MealItem from './meal-item.vue';

defineOptions({ name: 'MealList' });

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  meals: {
    type: Array as PropType<MealState[]>,
    required: true,
  },
});

const emit = defineEmits(['action', 'open', 'close']);

const { selectedMealId, selectedFoodId, isSelectedFoodInMeal, action } = useMealList(props, { emit });

const contextId = ref<string | undefined>(undefined);
const drawer = ref(false);

function closeDrawer() {
  drawer.value = false;
}

function toggleDrawer() {
  drawer.value = !drawer.value;
}

function updateContextId(id: string) {
  contextId.value = id === contextId.value ? undefined : id;
}

watch(drawer, (val) => {
  emit(val ? 'open' : 'close');

  if (!val)
    return;

  contextId.value = selectedMealId.value ?? selectedFoodId.value;
});
</script>

<style lang="scss">
.btn-review .btn-review__wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateY(-10%);
  border-top-left-radius: 5rem;
  border-top-right-radius: 5rem;
  border-bottom-left-radius: 3rem;
  border-bottom-right-radius: 3rem;
  width: 5rem;
  height: 5rem;

  background-color: white;
  box-shadow: 0px -2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2));

  .btn-review__content {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-top-left-radius: 5rem;
    border-top-right-radius: 5rem;
    border-bottom-left-radius: 3rem;
    border-bottom-right-radius: 3rem;
    width: 4.5rem;
    height: 4.5rem;

    color: rgb(var(--v-theme-on-primary));
    background-color: rgb(var(--v-theme-primary));
  }
}
</style>
