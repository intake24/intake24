<template>
  <v-sheet class="feedback-section">
    <h2 class="text-h2 font-weight-medium text-center mb-6 chart-print-title">
      {{ $t('feedback.topFoods.title') }}
    </h2>
    <v-container class="container-max">
      <v-row class="d-print-none" justify="center" no-gutters>
        <v-col
          v-for="chart in charts"
          :key="`screen-${chart.id}`"
          class="chart-wrapper"
          cols="12"
          md="6"
          xl="4"
        >
          <chart autoresize class="chart" :option="chart" />
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

import type { TopFoodData } from '../top-foods';

import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { computed } from 'vue';
import Chart from 'vue-echarts';

import { round } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

const props = defineProps({
  topFoods: {
    type: Object as PropType<TopFoodData>,
    required: true,
  },
});

use([SVGRenderer, PieChart, TitleComponent, TooltipComponent]);

const { i18n: { t }, translate } = useI18n();

const charts = computed(() => {
  const { colors } = props.topFoods;

  const chartOptions: EChartsOption[] = props.topFoods.chartData.map((nutrient) => {
    const { unit, data } = nutrient;
    const id = nutrient.id.join(':');
    const name = translate(nutrient.name);

    return {
      textStyle: {
        fontFamily: `Rubik, sans-serif`,
      },
      id,
      title: {
        text: t('feedback.topFoods.chart', { nutrient: name }),
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

<style lang="scss">
// TODO: extract to common styles as used in other charts
.chart {
  height: 450px;
}

.chart-print-wrapper {
  height: 450px;
  width: 100%;
}

.chart-print {
  height: 450px;
  width: 680px;
  margin: auto;
}

@media print {
  .chart-print-title {
    page-break-after: avoid;
    break-after: avoid;
  }

  .chart-print-wrapper {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
</style>
