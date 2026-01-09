<template>
  <v-tabs-window-item value="conditions">
    <div class="d-flex flex-row ga-2">
      <div>
        <v-btn class="my-4 ignore-item" color="primary" @click="add">
          <v-icon icon="$add" start />
          {{ $t(`survey-schemes.conditions.add`) }}
        </v-btn>
        <v-tabs v-model="selectedCondition" direction="vertical">
          <vue-draggable
            v-model="currentConditions"
            :animation="300"
            class="d-flex flex-column"
            handle=".drag-and-drop__handle"
            @end="update"
          >
            <v-tab v-for="condition in currentConditions" :key="condition.id" :class="{ 'mt-4': condition.orPrevious }" :value="condition.id">
              <v-chip v-if="condition.orPrevious" class="font-weight-medium position-absolute" style="top: -1.5em;">
                OR
              </v-chip>
              <v-icon class="drag-and-drop__handle " icon="$handle" start />
              {{ $t(`survey-schemes.conditions.property.${condition.property.id}`) }}
            </v-tab>
          </vue-draggable>
        </v-tabs>
      </div>
      <v-tabs-window v-model="selectedCondition" class="flex-grow-1">
        <v-tabs-window-item v-for="(condition, idx) in currentConditions" :key="condition.id" :value="condition.id">
          <v-card border flat>
            <v-card-title>
              <v-icon icon="fas fa-location-arrow" start />
              {{ $t(`survey-schemes.conditions.property.${condition.property.id}`) }}
            </v-card-title>
            <v-card-text class="px-0">
              <condition-summary :condition="condition" />
            </v-card-text>
            <v-card-text>
              <v-row v-if="idx !== 0">
                <v-col cols="12" md="6">
                  <v-checkbox-btn
                    v-model="condition.orPrevious"
                    hide-details="auto"
                    :label="$t(`survey-schemes.conditions.orPrevious`)"
                    outlined
                  />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    hide-details="auto"
                    item-value="object"
                    :items="objectSelectList"
                    :label="$t('survey-schemes.conditions.object._')"
                    :model-value="condition.object"
                    variant="outlined"
                    @update:model-value="updatePromptConditionObject(idx, $event)"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    hide-details="auto"
                    item-value="type"
                    :items="propertySelectList[condition.object]"
                    :label="$t('survey-schemes.conditions.property._')"
                    :model-value="condition.property.id"
                    variant="outlined"
                    @update:model-value="updatePromptConditionProperty(idx, $event)"
                  />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-title>{{ $t(`survey-schemes.conditions._`) }}</v-card-title>
            <v-card-text>
              <component :is="condition.property.type" v-model="condition.property.check" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn class="font-weight-bold" color="error" variant="text" @click="remove(idx)">
                <v-icon icon="$delete" start />
                {{ $t('survey-schemes.conditions.remove') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </v-tabs-window-item>
</template>

<script lang='ts'>
import type { PropType } from 'vue';
import { deepEqual } from 'fast-equals';
import { mapValues } from 'lodash-es';
import { computed, defineComponent, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { withIdList } from '@intake24/admin/util';
import {
  conditionObjectHasProperty,
  conditionObjectIds,
  getConditionDefaults,
  getDefaultConditionProperty,
  promptConditionDefaults,
} from '@intake24/common/prompts';
import type { Condition, ConditionObjectId, ObjectPropertyId } from '@intake24/common/prompts';
import { foodSections, mealSections } from '@intake24/common/surveys';
import type { PromptSection } from '@intake24/common/surveys';
import { randomString } from '@intake24/common/util';
import { copy } from '@intake24/common/util/objects';
import { useI18n } from '@intake24/i18n';

import conditionPartials from './conditions';

export default defineComponent({
  name: 'PromptConditions',

  components: {
    ...conditionPartials.check,
    ConditionSummary: conditionPartials.summary,
    VueDraggable,
  },

  props: {
    conditions: {
      type: Array as PropType<Condition[]>,
      required: true,
    },
    promptSection: {
      type: String as PropType<PromptSection>,
      required: false,
    },
  },

  emits: ['update:conditions'],

  setup(props, { emit }) {
    const { i18n: { t } } = useI18n();

    const currentConditions = ref(withIdList(props.conditions));
    const selectedCondition = ref(currentConditions.value.length ? currentConditions.value[0].id : undefined);

    const objectSelectList = computed(() => {
      const allowedObjects: ConditionObjectId[] = ['survey'];

      if (props.promptSection !== undefined) {
        if ((mealSections as readonly string[]).includes(props.promptSection))
          allowedObjects.push('meal');

        if ((foodSections as readonly string[]).includes(props.promptSection))
          allowedObjects.push('food');
      }

      return allowedObjects.map(object => ({ object, title: t(`survey-schemes.conditions.object.${object}`) }));
    });

    const propertySelectList = computed(() => {
      return mapValues(promptConditionDefaults, properties => Object.keys(properties).map(id => ({ type: id, title: t(`survey-schemes.conditions.property.${id}`) })));
    });

    const outputConditions = computed(() => currentConditions.value.map(({ id, ...rest }) => copy(rest)));

    const add = () => {
      const defaultObject = conditionObjectIds[0];

      const id = randomString(6);
      currentConditions.value.push(copy({
        id,
        ...getConditionDefaults(defaultObject, getDefaultConditionProperty(defaultObject)),
      }));

      selectedCondition.value = id;
    };

    const remove = (index: number) => {
      currentConditions.value.splice(index, 1);
      if (currentConditions.value.length > 0)
        currentConditions.value[0].orPrevious = false;

      selectedCondition.value = currentConditions.value?.at(-1)?.id ?? undefined;
    };

    const update = () => {
      emit('update:conditions', outputConditions.value);
    };

    watch(currentConditions, (val) => {
      if (deepEqual(val, outputConditions.value))
        return;

      emit('update:conditions', val);
    });

    watch(outputConditions, () => {
      update();
    }, { deep: true });

    return {
      add,
      currentConditions,
      selectedCondition,
      objectSelectList,
      propertySelectList,
      remove,
      update,
    };
  },

  methods: {
    updatePromptConditionObject(idx: number, newObjectId: ConditionObjectId) {
      const currentCondition = this.currentConditions[idx];

      if (currentCondition.object === newObjectId)
        return;

      // If currently selected property is compatible with the new object, keep current property settings
      if (conditionObjectHasProperty(newObjectId, currentCondition.property.id)) {
        this.currentConditions.splice(
          idx,
          1,
          // Type cast required since we don't know if new object has the same property at compile time
          copy({ ...currentCondition, object: newObjectId } as Condition & { id: string }),
        );
      }
      // Otherwise reset it to default property for that object
      else {
        this.currentConditions.splice(
          idx,
          1,
          copy({ ...getConditionDefaults(newObjectId, getDefaultConditionProperty(newObjectId)), id: currentCondition.id }),
        );
      }
    },

    updatePromptConditionProperty(idx: number, newPropertyId: string) {
      const currentCondition = this.currentConditions[idx];

      if (currentCondition.property.id === newPropertyId)
        return;

      this.currentConditions.splice(
        idx,
        1,
        copy({ ...getConditionDefaults(currentCondition.object, newPropertyId as ObjectPropertyId<ConditionObjectId>), id: currentCondition.id }),
      );
    },
  },
});
</script>

<style lang='scss' scoped></style>
