import type {
  AggregateFoodStats,
  CharacterParameters,
  CharacterRules,
  DemographicGroup,
  FruitAndVegPortions,
  UserDemographic,
} from './classes';
import type {
  CardType,
  DemographicGroupScaleSector,
  FiveADayCard,
  NutrientGroupCard,
} from '@intake24/common/feedback';

import { round } from '@intake24/common/util';

import { DemographicRange } from './classes';

export type FiveADayCardWithDemGroups = FiveADayCard & { demographicGroups: DemographicGroup[] };
export type NutrientGroupCardWithDemGroups = NutrientGroupCard & {
  demographicGroups: DemographicGroup[];
};

export type CardWithDemGroups
  = | CharacterRules
    | FiveADayCardWithDemGroups
    | NutrientGroupCardWithDemGroups;

export interface FiveADayParameters extends FiveADayCard {
  portions: number;
  scaleSector: DemographicGroupScaleSector;
}

export interface NutrientGroupParameters extends NutrientGroupCard {
  intake: number;
  recommendedIntake: DemographicRange;
  scaleSector: DemographicGroupScaleSector;
}

export type FeedbackCardParameters
  = | CharacterParameters
    | FiveADayParameters
    | NutrientGroupParameters;

export type BuildCardOps = {
  foods: AggregateFoodStats[];
  userDemographic: UserDemographic;
  averageIntake: Map<string, number>;
  fruitAndVegPortions: FruitAndVegPortions;
};

export function buildCharacterParams(characterRule: CharacterRules, { foods, userDemographic }: BuildCardOps): FeedbackCardParameters | undefined {
  return characterRule.getSentiment(userDemographic, foods);
}

export function buildNutrientGroupParams(card: NutrientGroupCardWithDemGroups, { averageIntake, userDemographic }: BuildCardOps): NutrientGroupParameters | undefined {
  const scaleSector = card.demographicGroups
    .filter(dg => dg.matchesUserDemographic(userDemographic))
    .at(0)
    ?.scaleSectors[0];
  if (!scaleSector)
    return undefined;

  const { low, high } = card;

  let intake = card.nutrientTypes.reduce((total, nutrientTypeId) => {
    const nutrientIntake = averageIntake.get(nutrientTypeId);
    if (nutrientIntake !== undefined)
      return total + nutrientIntake;

    return total;
  }, 0);
  intake = round(intake);

  const recommendedIntake = new DemographicRange(low?.threshold ?? 0, high?.threshold ?? 1000);

  return { ...card, intake, recommendedIntake, scaleSector };
}

export function buildFiveADayParams(card: FiveADayCardWithDemGroups, { fruitAndVegPortions, userDemographic }: BuildCardOps): FiveADayParameters | undefined {
  const scaleSector = card.demographicGroups
    .filter(dg => dg.matchesUserDemographic(userDemographic))
    .at(0)
    ?.scaleSectors[0];

  if (!scaleSector)
    return undefined;

  return { ...card, portions: round(fruitAndVegPortions.total), scaleSector };
}

export const mappers: Record<
  CardType,
  (card: any, ops: BuildCardOps) => FeedbackCardParameters | undefined
> = {
  character: buildCharacterParams,
  'five-a-day': buildFiveADayParams,
  'nutrient-group': buildNutrientGroupParams,
};

export function buildCardParams(cards: CardWithDemGroups[], ops: BuildCardOps): FeedbackCardParameters[] {
  const cardParameters = cards.reduce<FeedbackCardParameters[]>((acc, card) => {
    const cardParams = mappers[card.type](card, ops);
    if (cardParams)
      acc.push(cardParams);

    return acc;
  }, []);

  return cardParameters;
}
