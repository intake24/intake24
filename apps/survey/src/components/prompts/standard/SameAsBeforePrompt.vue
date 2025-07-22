<template>
  <card-layout v-bind="{ food, meal, prompt, section, isValid, sabOptions }" @action="action">
    <v-card-text class="pt-2 d-flex">
      <v-card v-if="showSABcard" class="border flat width=100%">
        <v-list v-if="serving || quantity || showLeftovers" class="px-4" color="grey-lighten-4">
          <div class="d-flex align-center">
            <v-list-subheader class="flex-grow-1">
              {{ promptI18n.hadQuantity }}
            </v-list-subheader>
            <div class="align-right">
              <v-radio-group
                v-model="sabOptions.portionSize"
                :hide-details="true"
                :inline="true"
              >
                <v-radio
                  :label="$t('common.action.yes')"
                  :value="true"
                />
                <v-radio
                  :label="$t('common.action.no')"
                  :value="false"
                />
              </v-radio-group>
            </div>
          </div>
          <v-divider />
          <v-list-item v-if="serving" class="ps-0" density="compact">
            <v-list-item-title>
              {{ promptI18n.serving }}
            </v-list-item-title>
            <template #prepend>
              <v-icon icon="fas fa-caret-right" />
            </template>
          </v-list-item>
          <v-list-item v-if="quantity" class="ps-0" density="compact">
            <template #prepend>
              <v-icon icon="fas fa-caret-right" />
            </template>
            <v-list-item-title>
              {{ promptI18n.quantity }}
            </v-list-item-title>
          </v-list-item>
          <div v-if="showLeftovers" class="ps-0" density="compact">
            <v-list-item class="ps-0" density="compact">
              <template #prepend>
                <v-icon icon="fas fa-caret-right" />
              </template>
              <v-list-item-title>{{ promptI18n.leftovers }}</v-list-item-title>
            </v-list-item>
          </div>
        </v-list>
        <v-list class="px-4" color="grey-lighten-4">
          <div class="d-flex align-center">
            <v-list-subheader class="flex-grow-1">
              {{ promptI18n.hadWith }}
            </v-list-subheader>
            <div class="align-right">
              <v-radio-group
                v-model="sabOptions.linkedFoods"
                :hide-details="true"
                :inline="true"
              >
                <v-radio
                  :label="$t('common.action.yes')"
                  :value="true"
                />
                <v-radio
                  :label="$t('common.action.no')"
                  :value="false"
                />
              </v-radio-group>
            </div>
          </div>
          <v-divider />
          <v-list-item v-if="!linkedFoods.length" class="ps-0" density="compact">
            <template #prepend>
              <v-icon icon="fas fa-caret-right" />
            </template>
            <v-list-item-title>
              {{ promptI18n.noAddedFoods }}
            </v-list-item-title>
          </v-list-item>
          <template v-if="linkedFoods.length">
            <v-list-item v-for="linkedFood in linkedFoods" :key="linkedFood.id" class="ps-0" density="compact">
              <template #prepend>
                <v-icon icon="fas fa-caret-right" />
              </template>
              {{ linkedFood.text ? linkedFood.text : '' }}
            </v-list-item>
          </template>
        </v-list>
        <v-list class="px-4" color="grey-lighten-4">
          <div class="d-flex align-center">
            <v-list-subheader class="flex-grow-1">
              {{ promptI18n.characteristics }}
            </v-list-subheader>
            <div class="align-right">
              <v-radio-group
                v-model="sabOptions.customPromptAnswers"
                :hide-details="true"
                :inline="true"
              >
                <v-radio
                  :label="$t('common.action.yes')"
                  :value="true"
                />
                <v-radio
                  :label="$t('common.action.no')"
                  :value="false"
                />
              </v-radio-group>
            </div>
          </div>
          <v-divider />
          <v-list v-if="customPromptAnswers && Object.keys(customPromptAnswers).length > 0" class="px-4" color="grey-lighten-4">
            <div v-for="(customPromptAnswer, index) in customPromptAnswers" :key="index">
              <v-list-subheader>{{ promptNames[index] || '' }}</v-list-subheader>
              <v-divider />
              <v-list-item v-for="(answer, answerIdx) in customPromptAnswer" :key="answerIdx" class="ps-0" density="compact">
                <template #prepend>
                  <v-icon icon="fas fa-caret-right" />
                </template>
                <v-list-item-title>{{ answer }}</v-list-item-title>
              </v-list-item>
            </div>
          </v-list>
        </v-list>
      </v-card>
    </v-card-text>
    <template #actions>
      <template v-if="!showSABcard">
        <v-btn :title="promptI18n.notSame" @click.stop="action('notSame')">
          <v-icon icon="$no" start /> {{ promptI18n.notSame }}
        </v-btn>
        <v-btn :title="promptI18n.same" @click.stop="onSame">
          <v-icon icon="$yes" start /> {{ promptI18n.same }}
        </v-btn>
        <v-btn :title="promptI18n.details" variant="flat" @click.stop="showSABcard = !showSABcard">
          <v-icon icon="$info" start /> {{ promptI18n.details }}
        </v-btn>
      </template>
      <template v-else>
        <v-btn block color="primary" :title="$t('common.action.continue')" variant="flat" @click.stop="onSame">
          <v-icon icon="$next" start /> {{ $t('common.action.continue') }}
        </v-btn>
      </template>
    </template>
    <template #nav-actions>
      <template v-if="!showSABcard">
        <v-btn color="primary" :title="promptI18n.notSame" @click.stop="action('notSame')">
          <span class="text-overline font-weight-medium">
            {{ promptI18n.notSame }}</span>
          <v-icon class="pb-1" icon="$no" />
        </v-btn>
        <v-divider vertical />
        <v-btn color="primary" :title="promptI18n.same" @click.stop="onSame">
          <span class="text-overline font-weight-medium">
            {{ promptI18n.same }}</span>
          <v-icon class="pb-1" icon="$yes" />
        </v-btn>
        <v-divider vertical />
        <v-btn color="primary" :title="promptI18n.details" @click.stop="showSABcard = !showSABcard">
          <span class="text-overline font-weight-medium">
            {{ promptI18n.details }}</span>
          <v-icon class="pb-1" icon="$info" />
        </v-btn>
      </template>
      <template v-else>
        <v-btn block color="primary" title="$t('common.action.continue')" variant="flat" @click.stop="onSame">
          <span class="text-overline font-weight-medium">
            {{ $t('common.action.continue') }}
          </span>
          <v-icon class="pb-1" icon="$next" />
        </v-btn>
      </template>
    </template>
  </card-layout>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed, onMounted, ref } from 'vue';
import type { EncodedFood } from '@intake24/common/surveys';
import { useI18n } from '@intake24/i18n';
import { usePromptUtils } from '@intake24/survey/composables';
import { useSurvey } from '@intake24/survey/stores';
import type { SameAsBeforeItem } from '@intake24/survey/stores';
import { CardLayout } from '../layouts';
import { useStandardUnits } from '../partials';
import { createBasePromptProps } from '../prompt-props';

const props = defineProps({
  ...createBasePromptProps<'same-as-before-prompt'>(),
  sabFood: {
    type: Object as PropType<SameAsBeforeItem>,
    required: true,
  },
});

const emit = defineEmits(['action', 'update:modelValue', 'update:sabOptions']);

// Reactive state for "options"
const sabOptions = ref<Record<string, any>>({});

const showSABcard = ref(false); // New reactive state for showing/hiding card text
const { i18n: { t, locale }, translate } = useI18n();
const { action, translatePrompt, type } = usePromptUtils(props, { emit });
const { standardUnitRefs, resolveStandardUnits } = useStandardUnits();
const survey = useSurvey();

const isDrink = computed(() => props.sabFood.food.data.categories.includes('DRNK'));
const isValid = true;

const getQuantity = (food: EncodedFood) => food.portionSize && 'quantity' in food.portionSize ? (food.portionSize.quantity ?? 1) : 1;

function getPortionWeight(food: EncodedFood) {
  if (food.portionSize?.method === 'milk-in-a-hot-drink')
    return (food.portionSize?.milkVolumePercentage ?? 0) * 100;

  const servingWeight = food.portionSize?.servingWeight ?? 0;
  const linkedServingWeight
        = (
          food.linkedFoods.find(
            linkedFood =>
              linkedFood.type === 'encoded-food'
              && linkedFood.portionSize?.method === 'milk-in-a-hot-drink',
          ) as EncodedFood | undefined
        )?.portionSize?.servingWeight ?? 0;

  return Math.round((servingWeight + linkedServingWeight) / getQuantity(food));
}

function onSame() {
  console.debug('onSame action triggered');
  emit('update:sabOptions', { ...sabOptions.value }); // emit a copy to parent
  action('same');
}

function getUnit(food: EncodedFood) {
  switch (food.portionSize?.method) {
    case 'drink-scale':
      return 'ml';
    case 'milk-in-a-hot-drink':
      return '%';
    case 'standard-portion':
      if (food.portionSize.unit) {
        if (food.portionSize.unit.inlineEstimateIn)
          return `g (${food.portionSize.unit.inlineEstimateIn})`;

        const unit = standardUnitRefs.value[food.portionSize.unit.name]?.estimateIn;
        if (unit)
          return `g (${translate(unit)})`;
      }
  }

  return 'g';
}

const linkedFoods = computed(() =>
  props.sabFood.food.linkedFoods.map((food) => {
    const { id } = food;
    if (food.type === 'free-text')
      return { id, text: food.description };
    if (food.type === 'missing-food')
      return { id, text: food.info?.name ?? food.searchTerm };
    if (food.type === 'recipe-builder')
      return { id, text: food.template.name ?? food.searchTerm };

    const amount = Math.round(getPortionWeight(food));
    const unit = getUnit(food);
    return { id, text: `${translate(food.data.localName)} (${amount} ${unit})` };
  }),
);

const customPromptAnswers = computed(() => {
  const answers = props.sabFood.food.customPromptAnswers;
  if (!answers)
    return {};
  const filteredAnswers = Object.fromEntries(
    Object.entries(answers).filter(([_, value]) => value !== null),
  );
  const foods = survey.parameters?.surveyScheme.prompts.meals.foods;
  if (!foods)
    return {};

  return Object.fromEntries(
    Object.entries(filteredAnswers).map(([key, value]) => {
      const prompt = foods.find(item => item.id === key);
      const label = prompt && Array.isArray(value) && 'options' in prompt && prompt?.options?.[locale.value]
        ? value.map(v =>
            (prompt.options[locale.value].find(option => option.value === v)?.shortLabel
              || prompt.options[locale.value].find(option => option.value === v)?.label) ?? v,
          )
        : [];
      return [key, label];
    }),
  );
});

const promptNames = computed(() => {
  const foods = survey.parameters?.surveyScheme.prompts.meals.foods;
  if (!foods) {
    console.debug('No custom prompt names found');
    return {};
  }
  return foods.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.i18n?.name?.[locale.value] || item.i18n?.name?.en || '';
    return acc;
  }, {});
});

const quantity = computed(() => getQuantity(props.sabFood.food));
const serving = computed(() => {
  const amount = getPortionWeight(props.sabFood.food);
  const unit = getUnit(props.sabFood.food);
  return t(`prompts.${type.value}.serving`, { amount: `${amount} ${unit}` });
});
const servingQuantity = computed(() => t(`prompts.${type.value}.quantity`, { quantity: getQuantity(props.sabFood.food) }));

const leftovers = computed(() => {
  const { leftoversWeight, servingWeight } = props.sabFood.food.portionSize ?? {};
  if (!servingWeight || !leftoversWeight)
    return t(`prompts.${type.value}.noLeftovers.${isDrink.value ? 'drink' : 'food'}`);

  const leftoversPercentage = Math.round(leftoversWeight / (servingWeight / 100));

  return t(`prompts.${type.value}.leftovers`, { amount: `${leftoversPercentage}%` });
});

const leftoversEnabled = computed(() => {
  const prompt = survey.foodPrompts.find(item => item.component === `${props.sabFood.food.portionSize?.method}-prompt`);
  return prompt && 'leftovers' in prompt && prompt.leftovers;
});

const showLeftovers = computed(() => leftoversEnabled.value || !!props.sabFood.food.portionSize?.leftoversWeight);

const promptI18n = computed(() => ({
  serving: serving.value,
  quantity: servingQuantity.value,
  leftovers: leftovers.value,
  ...translatePrompt(['hadWith', 'noAddedFoods', 'same', 'notSame', 'details', 'hadQuantity', 'characteristics']),
}));

onMounted(async () => {
  const names = [props.sabFood.food, ...props.sabFood.food.linkedFoods].reduce<string[]>(
    (acc, food) => {
      if (
        food.type !== 'encoded-food'
        || !food.portionSize
        || food.portionSize?.method !== 'standard-portion'
        || !food.portionSize.unit
      ) {
        return acc;
      }

      acc.push(food.portionSize.unit.name);
      return acc;
    },
    [],
  );

  await resolveStandardUnits(names);
  // Set default values for sabOptions
  sabOptions.value = {
    portionSize: true,
    customPromptAnswers: true,
    linkedFoods: true,
  };
});
</script>
