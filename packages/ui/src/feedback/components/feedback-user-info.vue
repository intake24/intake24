<template>
  <v-col cols>
    <v-card>
      <v-toolbar color="grey-lighten-4">
        <v-toolbar-title class="text-subtitle-1 font-weight-medium text-uppercase">
          {{ $t('feedback.physicalData.title') }}
        </v-toolbar-title>
        <v-spacer />
        <v-tooltip location="left">
          <template #activator="{ props }">
            <v-btn
              icon="$edit"
              :title="$t('feedback.physicalData.change')"
              :to="{ name: 'feedback-physical-data', params: { surveyId } }"
              v-bind="props"
            />
          </template>
          <span>{{ $t('feedback.physicalData.change') }}</span>
        </v-tooltip>
      </v-toolbar>
      <v-list v-if="physicalData.length" class="py-0 list-border">
        <v-list-item v-for="(item, idx) in physicalData" :key="idx">
          <v-list-item-subtitle>
            {{ item }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>
    <!-- <v-btn
      class="mt-2 mx-auto"
      color="secondary"
      link
      outlined
      :title="$t('feedback.physicalData.recall')"
      :to="{ name: 'survey-home', params: { surveyId } }"
    >
      <v-icon left>fas fa-bowl-food</v-icon>
      {{ $t('feedback.physicalData.recall') }}
    </v-btn> -->
  </v-col>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { UserDemographic } from '../classes';
import { computed } from 'vue';
import { useI18n } from '@intake24/ui';

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
  userDemographic: {
    type: Object as PropType<UserDemographic>,
    required: true,
  },
});

const { i18n: { t } } = useI18n();

const ageAndSex = computed(() => {
  const items = [];
  const { sex, birthdate } = props.userDemographic.physicalData;

  if (sex !== null) {
    items.push(
      t('feedback.physicalData.sex', {
        sex: t(`feedback.physicalData.sexes.${sex}`),
      }),
    );
  }

  if (birthdate !== null) {
    items.push(
      t('feedback.physicalData.age', { age: props.userDemographic.getAge() }),
    );
  }

  return items;
});

const weightAndHeight = computed(() => {
  const items = [];
  const { heightCm, weightKg } = props.userDemographic.physicalData;

  if (heightCm !== null)
    items.push(t('feedback.physicalData.height', { height: heightCm }));

  if (weightKg !== null)
    items.push(t('feedback.physicalData.weight', { weight: weightKg }));

  return items;
});

const physicalData = computed(() => {
  const { userDemographic } = props;
  const items: string[] = [];

  if (userDemographic.physicalActivityLevel)
    items.push(userDemographic.physicalActivityLevel.name);

  if (ageAndSex.value.length)
    items.push(ageAndSex.value.join(' | '));

  if (weightAndHeight.value.length)
    items.push(weightAndHeight.value.join(' | '));

  if (userDemographic.physicalData.weightTarget) {
    items.push(
      t('feedback.physicalData.weightTarget', {
        target: t(
          `feedback.physicalData.weightTargets.${userDemographic.physicalData.weightTarget}`,
        ),
      }),
    );
  }

  return items;
});
</script>

<style lang="scss" scoped></style>
