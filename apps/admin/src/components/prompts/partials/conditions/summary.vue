<template>
  <code class="pa-5 d-flex align-baseline">
    <v-label class="mr-2">{{ $t(`survey-schemes.conditions.showIf`) }}</v-label>
    <v-label v-dompurify-html:i18n="info.summaryHtml" />
    <div v-if="info.showOp">
      <v-icon end size="small" start>{{ info.icon }}</v-icon>
      <v-label class="align-baseline">{{ info.check.value || '?' }}</v-label>
      <v-label
        v-if="info.showNotRequired" v-dompurify-html:i18n="$t(`survey-schemes.conditions.summary.notRequired`)" class="ml-2 align-baseline"
      />
    </div>
  </code>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Condition } from '@intake24/common/prompts';

import { computed } from 'vue';

import { opToIconMap } from '@intake24/admin/composables';
import { useI18n } from '@intake24/ui';

defineOptions({ name: 'ConditionSummary' });

const props = defineProps({
  condition: {
    type: Object as PropType<Condition>,
    required: true,
  },
});

const { i18n: { t } } = useI18n();
function getSummaryHtml(condition: Condition): string {
  const object = t(`survey-schemes.conditions.object.${condition.object}`).toLocaleLowerCase();
  const property = t(`survey-schemes.conditions.property.${condition.property.id}`).toLocaleLowerCase();

  switch (condition.property.type) {
    case 'flag': {
      return condition.property.check.value
        ? t(`survey-schemes.conditions.summary.flag.set`, { id: condition.property.check.flagId || '?', object })
        : t(`survey-schemes.conditions.summary.flag.notSet`, { id: condition.property.check.flagId || '?', object });
    }
    case 'tag': {
      return condition.property.check.value
        ? t(`survey-schemes.conditions.summary.tag.present`, { id: condition.property.check.tagId || '?', object })
        : t(`survey-schemes.conditions.summary.tag.absent`, { id: condition.property.check.tagId || '?', object });
    }
    case 'boolean': {
      const value = (condition.property.check.value ? t(`common.yes`) : t(`common.no`)).toLocaleLowerCase();
      return t(`survey-schemes.conditions.summary.boolean`, { object, property, value });
    }
    case 'value':
      return t(`survey-schemes.conditions.summary.value`, { object, property });
    case 'entityValue':
      return t(`survey-schemes.conditions.summary.entityValue`, { object, property });
    case 'promptAnswer':
      return t(`survey-schemes.conditions.summary.promptAnswer`, { object, property, promptId: condition.property.check.promptId || '?' });
    case 'userField':
      return t(`survey-schemes.conditions.summary.userField`, { object, property, field: condition.property.check.field || '?' });
    case 'mealCompletion':
      return t(`survey-schemes.conditions.summary.mealCompletion.${condition.property.check.completionState}`, { object });
    case 'foodCompletion':
      return t(`survey-schemes.conditions.summary.foodCompletion.${condition.property.check.completionState}`, { object });
    case 'externalSource':
      return t(`survey-schemes.conditions.summary.externalSource`, {
        object,
        provider: t(`survey-schemes.prompts.externalSources.sources.${condition.property.check.provider}`),
        state: t(`survey-schemes.prompts.externalSources.states.${condition.property.check.state}`),
        value: t(`survey-schemes.conditions.${condition.property.check.value ? 'is' : 'isNot'}`),
      });
    default:
      throw new Error(`Unexpected condition property type: ${condition.property.type}`);
  }
}

function getShowOp(condition: Condition): boolean {
  switch (condition.property.type) {
    case 'value':
    case 'promptAnswer':
    case 'userField':
      return true;
    default:
      return false;
  }
}

function getShowNotRequired(condition: Condition): boolean {
  switch (condition.property.type) {
    case 'promptAnswer':
      return !condition.property.check.required;
    default:
      return false;
  }
}

const info = computed(() => {
  const check = props.condition.property.check;

  return {
    summaryHtml: getSummaryHtml(props.condition),
    showOp: getShowOp(props.condition),
    showNotRequired: getShowNotRequired(props.condition),
    check,
    icon: 'op' in check ? opToIconMap[check.op] : undefined,
  };
});
</script>

<style lang="scss" scoped />
