<template>
  <v-card flat>
    <v-card-text class="px-0">
      <condition-summary :condition />
    </v-card-text>
    <v-container class="py-0" fluid>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            hide-details="auto"
            item-value="object"
            :items="objectSelectList"
            :label="$t('survey-schemes.conditions.object._')"
            :model-value="condition.object"
            variant="outlined"
            @update:model-value="updateConditionObject($event)"
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
            @update:model-value="updateConditionProperty($event)"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-card-title>{{ $t(`survey-schemes.conditions._`) }}</v-card-title>
    <v-card-text>
      <component
        :is="condition.property.type"
        :model-value="condition.property.check"
        @update="updateFilterCheck($event)"
      />
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { mapValues } from 'lodash-es';
import conditionPartials from '@intake24/admin/components/prompts/partials/conditions';
import { conditionObjectHasProperty, getConditionDefaults, getDefaultConditionProperty, promptConditionDefaults } from '@intake24/common/prompts';
import type { Condition, ConditionObjectId, ObjectPropertyId } from '@intake24/common/prompts';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

defineOptions({
  components: { ...conditionPartials.check, ConditionSummary: conditionPartials.summary },
});

const props = defineProps({
  objects: {
    type: Array as PropType<ConditionObjectId[]>,
    default: () => ['survey', 'meal', 'food'],
  },
  modelValue: {
    type: Object as PropType<Condition>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const condition = useVModel(props, 'modelValue', emit, { passive: true, deep: true });

const { i18n } = useI18n();

const objectSelectList: { object: ConditionObjectId; title: string }[]
  = props.objects.map(object => ({ object, title: i18n.t(`survey-schemes.conditions.object.${object}`) }));

const propertySelectList: Record<ConditionObjectId, { type: string; title: string }[]>
  = mapValues(promptConditionDefaults, properties => Object.keys(properties).map(id => ({ type: id, title: i18n.t(`survey-schemes.conditions.property.${id}`) })));

function updateCondition(newFilter: Condition) {
  condition.value = newFilter;
}

function updateConditionObject(newObjectId: ConditionObjectId) {
  if (condition.value.object === newObjectId)
    return;

  if (conditionObjectHasProperty(newObjectId, condition.value.property.id)) {
    updateCondition(copy({ ...condition.value, object: newObjectId } as Condition));
  }
  else {
    updateCondition(copy(getConditionDefaults(newObjectId, getDefaultConditionProperty(newObjectId))));
  }
}

function updateConditionProperty(newPropertyId: string) {
  if (condition.value.property.id === newPropertyId)
    return;

  updateCondition(copy(getConditionDefaults(condition.value.object, newPropertyId as ObjectPropertyId<ConditionObjectId>)));
}

function updateFilterCheck(check: any) {
  updateCondition(copy({ ...condition.value, check }));
}
</script>

<style lang="scss" scoped></style>
