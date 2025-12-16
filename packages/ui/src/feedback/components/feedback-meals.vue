<template>
  <v-sheet class="feedback-section">
    <h2 class="text-h2 font-weight-medium text-center mb-6 chart-print-title">
      {{ $t('feedback.meals.title') }}
    </h2>
    <v-container>
      <v-row class="mb-6" justify="center">
        <v-col cols="12" sm="auto">
          <v-select
            v-model="selected"
            class="mb-6"
            hide-details="auto"
            :items="submissionItems"
            :label="$t('recall.submissions._')"
            name="submissions"
            prepend-inner-icon="fas fa-calendar-day"
            variant="solo"
          />
          <v-data-table
            class="elevation-1"
            :headers="headers"
            :hide-default-footer="true"
            :items="mealStats.table.tableData"
          />
        </v-col>
      </v-row>
      <v-row class="d-print-none" justify="center" no-gutters>
        <v-col
          v-for="chart in charts"
          :key="`screen-${chart.id}`"
          class="chart-wrapper"
          cols="12"
          md="6"
          xl="4"
        >
          <v-card class="pa-4">
            <chart autoresize class="chart" :option="chart" />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <div class="d-none d-print-block">
      <div v-for="chart in charts" :key="`print-${chart.id}`" class="chart-print-wrapper">
        <chart autoresize class="chart-print" :option="chart" />
      </div>
    </div>
  </v-sheet>
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts';
import type { PropType } from 'vue';
import type { NutrientChartData } from '../charts';
import type { SurveyStats, SurveySubmission } from '../classes';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { computed, ref } from 'vue';
import Chart from 'vue-echarts';
import type { FeedbackMealChart, FeedbackMeals, FeedbackMealTable } from '@intake24/common/feedback';
import type { NutrientType } from '@intake24/common/types/http';
import { round } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';
import { getNutrientUnit } from '@intake24/ui/util';

interface FeedbackMealChartData extends FeedbackMealChart {
  chartData: NutrientChartData[];
}

type MealTableFieldData = Record<string, string | number | null>;

interface FeedbackMealTableData extends FeedbackMealTable {
  tableData: MealTableFieldData[];
}

interface FeedbackMealsData extends Omit<FeedbackMeals, 'chart' | 'table'> {
  chart: FeedbackMealChartData;
  table: FeedbackMealTableData;
}

const props = defineProps({
  config: {
    type: Object as PropType<FeedbackMeals>,
    required: true,
  },
  surveyStats: {
    type: Object as PropType<SurveyStats>,
    required: true,
  },
  nutrientTypes: {
    type: Array as PropType<NutrientType[]>,
    default: () => [],
  },
  submissions: {
    type: Array as PropType<SurveySubmission[]>,
    default: () => [],
  },
});

use([SVGRenderer, PieChart, TitleComponent, TooltipComponent]);

const { i18n: { t }, translate } = useI18n();

const selected = ref(props.submissions.length ? props.submissions[0].id : null);

const mealStats = computed<FeedbackMealsData>(() => {
  const { chart, table } = props.config;
  const meals = selected.value ? props.surveyStats.getMealStats(selected.value) : [];

  const chartData = chart.nutrients.map((nutrient) => {
    const { id, name } = nutrient;

    const unit = getNutrientUnit(id, props.nutrientTypes);

    const data = meals.map(meal => ({
      name: meal.name,
      value: meal.stats.getGroupAverageIntake(id),
    }));

    return { id, name, unit, data };
  });

  const tableData = meals.map((meal) => {
    return table.fields.reduce<MealTableFieldData>((acc, field) => {
      let resolvedValue: string | number | null = null;
      const value = translate(field.value);

      switch (field.type) {
        case 'standard':
          resolvedValue = meal[field.fieldId];
          break;
        case 'custom':
          resolvedValue = meal.customData[field.fieldId]?.toString() ?? null;
          break;
        case 'nutrient':
          resolvedValue = meal.stats.getGroupAverageIntake(field.types);
          break;
      }

      acc[field.fieldId]
        = value && resolvedValue ? value.replace('{value}', resolvedValue.toString()) : resolvedValue;

      return acc;
    }, {});
  });

  return { chart: { ...chart, chartData }, table: { ...table, tableData } };
});

const submissionItems = computed(() =>
  props.submissions.map((item, idx) => ({
    title: `${t('recall.submissions._')} ${idx + 1}  | ${new Date(
      item.endTime,
    ).toLocaleDateString()}`,
    value: item.id,
  })),
);

const headers = computed(() =>
  mealStats.value.table.fields.map(({ header, fieldId }) => ({
    title: translate(header),
    key: fieldId,
  })),
);

const charts = computed(() => {
  const {
    chart: { chartData, colors },
  } = mealStats.value;

  const chartOptions: EChartsOption[] = chartData.map((item) => {
    const { unit, data } = item;
    const id = item.id.join(':');
    const name = translate(item.name);

    return {
      textStyle: {
        fontFamily: `Rubik, sans-serif`,
      },
      id,
      title: {
        text: t('feedback.meals.chart', { nutrient: name }),
        left: 'center',
        textStyle: {
          fontWeight: 'bolder',
          fontSize: 18,
        },
      },
      left: 'center',
      tooltip: {
        className: 'text-wrap',
        trigger: 'item',
        position: (point, params, dom, rect, { contentSize, viewSize }) => [
          viewSize[0] / 2 - contentSize[0] / 2,
          '40%',
        ],
        formatter: ({ seriesName, name: itemName, value, percent }: any) =>
          `<strong>${seriesName}</strong> <br/> ${itemName}: ${round(
            value,
          )} ${unit} (${Math.round(percent ?? 0)}%)`,
      },
      series: [
        {
          id,
          name,
          type: 'pie',
          radius: ['35%', '70%'],
          color: colors,
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 0,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          itemStyle: {
            borderRadius: 5,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            alignTo: 'edge',
            formatter: ({ name: itemName, value, percent }) =>
              `${itemName} \n {times|${round(
                typeof value === 'number' ? value : 0,
              )} ${unit} (${Math.round(percent ?? 0)}%)}`,
            minMargin: 5,
            edgeDistance: 10,
            lineHeight: 15,
            rich: {
              times: {
                fontSize: 12,
                color: '#999',
              },
            },
          },
          labelLine: {
            length: 15,
            length2: 0,
            maxSurfaceAngle: 80,
          },
        },
      ],
    };
  });

  return chartOptions;
});
</script>

<style lang="scss"></style>
