import { computed } from 'vue';
import type { CardType, NutrientRuleType, Sentiment } from '@intake24/common/feedback';
import { round } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import type { CharacterParameters, FeedbackCardParameters, FiveADayParameters, NutrientGroupParameters } from '@intake24/ui/feedback';
import { DemographicRange } from '../../classes';

export type FeedbackDetails = {
  name: string;
  summary: string | null;
  description: string | null;
  showIntake: ('summary' | 'description')[];
  intake: number;
  recommendedIntake: DemographicRange | null;
  unit: string;
  unitDescription: string | null;
  sentiment: Sentiment | null;
  color: string;
  textClass?: string;
  iconClass: string;
  warning?: string | null;
};

export type UseCardProps = {
  parameters: FeedbackCardParameters;
};

export function useCard(props: UseCardProps) {
  const { i18n: { t }, translate } = useI18n();

  function getTextClass(sentiment: Sentiment | null): string | undefined {
    if (!sentiment || sentiment === 'neutral')
      return undefined;

    if (['good', 'excellent'].includes(sentiment))
      return 'text-success';

    if (['bit_low', 'bit_high'].includes(sentiment))
      return 'text-warning';

    if (['too_low', 'low', 'high', 'too_high'].includes(sentiment))
      return 'text-error';

    return undefined;
  }

  function getIconClass(sentiment: Sentiment | null): string {
    const defaultIcon = 'fas fa-crosshairs';

    const icons: Record<Sentiment, string> = {
      too_low: 'fas fa-angle-double-down',
      low: 'fas fa-angle-double-down',
      bit_low: 'fas fa-angle-down',
      neutral: defaultIcon,
      good: defaultIcon,
      excellent: defaultIcon,
      bit_high: 'fas fa-angle-up',
      high: 'fas fa-angle-double-up',
      too_high: 'fas fa-angle-double-up',
    };

    return sentiment ? icons[sentiment] : defaultIcon;
  }

  function getUnitFromNutrientRule(nutrientRule: NutrientRuleType, defaultUnit: string): string {
    switch (nutrientRule) {
      case 'energy_divided_by_bmr':
        return '%';
      case 'per_unit_of_weight':
        return `${defaultUnit} per kg`;
      case 'percentage_of_energy':
        return '%';
      case 'range':
      default:
        return defaultUnit;
    }
  }

  function getCharacterDetail(parameters: CharacterParameters): FeedbackDetails {
    const { sentiment: charSentiment, results, color, showRecommendations } = parameters;

    const details = results.map((result) => {
      const {
        consumption: intake,
        resultedDemographicGroup: { nutrientRuleType, nutrient, scaleSectors },
      } = result;

      const { name, summary, description, intake: showIntake, range, sentiment } = scaleSectors[0];

      return {
        name: translate(name),
        summary: translate(summary),
        description: translate(description),
        intake: round(intake),
        showIntake,
        recommendedIntake: showRecommendations
          ? new DemographicRange(round(range.start), round(range.end))
          : null,
        unit: getUnitFromNutrientRule(nutrientRuleType, nutrient!.unit),
        unitDescription: t(`feedback.unitDescription.${nutrientRuleType}`),
        sentiment,
        color,
        textClass: getTextClass(charSentiment ? sentiment : null),
        iconClass: getIconClass(charSentiment ? sentiment : null),
      };
    });

    return details[0];
  }

  function getFiveADayDetail(parameters: FiveADayParameters): FeedbackDetails {
    const {
      low,
      high,
      unit,
      portions,
      color,
      scaleSector: { name, summary, description, intake: showIntake },
      showRecommendations,
    } = parameters;
    const sentiment = null;

    return {
      name: translate(name),
      summary: translate(summary),
      description: translate(description),
      intake: portions,
      showIntake,
      recommendedIntake: showRecommendations
        ? new DemographicRange(high?.threshold ?? 5, high?.threshold ?? 5)
        : null,
      unit: translate(unit.name),
      unitDescription: translate(unit.description),
      sentiment,
      color,
      iconClass: getIconClass(sentiment),
      warning: low && portions < low.threshold ? translate(low.message) : undefined,
    };
  }

  function getNutrientGroupDetail(parameters: NutrientGroupParameters): FeedbackDetails {
    const {
      low,
      high,
      unit,
      intake,
      recommendedIntake,
      color,
      scaleSector: { name, summary, description, intake: showIntake },
      showRecommendations,
    } = parameters;
    const sentiment = null;

    let warning;

    if (low && intake < low.threshold)
      warning = translate(low.message);
    else if (high && intake > high.threshold)
      warning = translate(high.message);

    return {
      name: translate(name),
      summary: translate(summary),
      description: translate(description),
      intake: round(intake),
      showIntake,
      recommendedIntake: showRecommendations
        ? new DemographicRange(round(recommendedIntake.start), round(recommendedIntake.end))
        : null,
      unit: translate(unit.name),
      unitDescription: translate(unit.description),
      sentiment,
      color,
      iconClass: getIconClass(sentiment),
      warning,
    };
  }

  const getDetails: Record<CardType, (...args: any[]) => FeedbackDetails> = {
    character: getCharacterDetail,
    'five-a-day': getFiveADayDetail,
    'nutrient-group': getNutrientGroupDetail,
  };

  const detail = computed(() => getDetails[props.parameters.type](props.parameters));
  const backgroundImage = computed(() => props.parameters.image);

  const formatOutput = (value: number | string, unit: string): string => `${value} ${unit}`;

  return {
    detail,
    backgroundImage,
    getDetails,
    formatOutput,
  };
}
