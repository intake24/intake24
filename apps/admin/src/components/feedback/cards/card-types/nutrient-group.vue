<template>
  <card-unit v-bind="{ unit: modelValue.unit }" @update:unit="update('unit', $event)" />
  <card-thresholds
    :thresholds="{ high: modelValue.high, low: modelValue.low }"
    @update:high="update('high', $event)"
    @update:low="update('low', $event)"
  />
  <v-tabs-window-item value="nutrients">
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-card-title>{{ $t('nutrient-types.current') }}</v-card-title>
          <v-list class="list-border">
            <transition-group name="drag-and-drop" type="transition">
              <v-list-item
                v-for="(nutrientType, idx) in currentNutrientTypes"
                :key="nutrientType.id"
                link
              >
                <template #prepend>
                  <v-icon>$nutrient-types</v-icon>
                </template>
                <v-list-item-title>
                  {{ nutrientType.description }}
                </v-list-item-title>
                <template #append>
                  <v-list-item-action>
                    <v-btn color="error" icon="$delete" :title="$t('nutrient-types.remove')" @click.stop="remove(idx)" />
                  </v-list-item-action>
                </template>
              </v-list-item>
            </transition-group>
          </v-list>
        </v-col>
        <v-divider vertical />
        <v-col cols="12" md="6">
          <v-card-title>{{ $t('nutrient-types.available') }}</v-card-title>
          <v-text-field
            v-model="search"
            clearable
            hide-details="auto"
            :label="$t('nutrient-types._')"
            prepend-inner-icon="$search"
            variant="outlined"
          />
          <v-list class="list-border">
            <transition-group name="drag-and-drop" type="transition">
              <v-list-item
                v-for="nutrientType in visibleNutrientTypes"
                :key="nutrientType.id"
                link
              >
                <template #prepend>
                  <v-icon>$nutrient-types</v-icon>
                </template>
                <v-list-item-title>
                  {{ nutrientType.description }}
                </v-list-item-title>
                <template #append>
                  <v-list-item-action>
                    <v-btn
                      icon
                      :title="$t('nutrient-types.add')"
                      @click.stop="add(nutrientType.id)"
                    >
                      <v-icon color="info">
                        $add
                      </v-icon>
                    </v-btn>
                  </v-list-item-action>
                </template>
              </v-list-item>
            </transition-group>
            <v-skeleton-loader
              v-if="nutrientTypesAvailableToLoad"
              v-intersect="tryLoadMoreNutrientTypes"
              type="list-item"
            />
          </v-list>
        </v-col>
      </v-row>
    </v-container>
  </v-tabs-window-item>
  <v-tabs-window-item value="json">
    <json-editor v-bind="{ modelValue }" @update:model-value="$emit('update:modelValue', $event)" />
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { NutrientGroupCard } from '@intake24/common/feedback';
import type { NutrientTypeResponse } from '@intake24/common/types/http/admin';

import { watchDebounced } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { JsonEditor } from '@intake24/admin/components/editors';
import { useEntry } from '@intake24/admin/stores';

import { CardThresholds, CardUnit } from '../partials';

defineOptions({ name: 'NutrientGroupCard' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<NutrientGroupCard>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const currentNutrientTypeIds = ref([...props.modelValue.nutrientTypes]);
const search = ref<string | null>(null);
const filteredNutrientTypes = ref<NutrientTypeResponse[]>([]);
const visibleNutrientTypes = ref<NutrientTypeResponse[]>([]);

const allNutrientTypes = computed<NutrientTypeResponse[]>(
  () => useEntry().refs.nutrientTypes ?? [],
);

const availableNutrientTypes = computed(() =>
  allNutrientTypes.value.filter(
    nutrient => !currentNutrientTypeIds.value.includes(nutrient.id),
  ),
);

const currentNutrientTypes = computed(() =>
  currentNutrientTypeIds.value.reduce<NutrientTypeResponse[]>((acc, nutrientId) => {
    const match = allNutrientTypes.value.find(nutrient => nutrient.id === nutrientId);

    if (match)
      acc.push(match);

    return acc;
  }, []),
);

function loadMoreNutrientTypes() {
  const startIndex = visibleNutrientTypes.value.length;
  const endIndex
    = startIndex + 15 > filteredNutrientTypes.value.length
      ? filteredNutrientTypes.value.length
      : startIndex + 15;

  const items = filteredNutrientTypes.value.slice(startIndex, endIndex);
  visibleNutrientTypes.value.push(...items);
}

function loadFilteredNutrientTypes() {
  filteredNutrientTypes.value = search.value
    ? availableNutrientTypes.value.filter(
        nutrient => !!nutrient.description.match(new RegExp(search.value, 'i')),
      )
    : [...availableNutrientTypes.value];

  visibleNutrientTypes.value = [];
  loadMoreNutrientTypes();
}

const nutrientTypesAvailableToLoad = computed(
  () => visibleNutrientTypes.value.length < filteredNutrientTypes.value.length,
);

function tryLoadMoreNutrientTypes(isIntersecting: boolean) {
  if (!isIntersecting || !nutrientTypesAvailableToLoad.value)
    return;

  loadMoreNutrientTypes();
}

function update(field: string, value: any) {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
}

function add(nutrientTypeId: string) {
  currentNutrientTypeIds.value.push(nutrientTypeId);

  loadFilteredNutrientTypes();

  update('nutrientTypes', currentNutrientTypeIds.value);
};

function remove(index: number) {
  currentNutrientTypeIds.value.splice(index, 1);

  loadFilteredNutrientTypes();

  update('nutrientTypes', currentNutrientTypeIds.value);
};

watch(
  allNutrientTypes,
  () => {
    loadFilteredNutrientTypes();
  },
  { immediate: true },
);

watchDebounced(
  search,
  () => {
    loadFilteredNutrientTypes();
  },
  { debounce: 500, maxWait: 1000 },
);
</script>
