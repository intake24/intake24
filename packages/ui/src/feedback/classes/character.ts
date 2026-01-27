import type AggregateFoodStats from './aggregate-food-stats';
import type DemographicGroup from './demographic-group';
import type DemographicResult from './demographic-result';
import type DemographicScaleSector from './demographic-scale-sector';
import type UserDemographic from './user-demographic';
import type {
  Character,
  CharacterSentiment,
  Sentiment,
} from '@intake24/common/feedback';

import { sentiments as defaultSentiments } from '@intake24/common/feedback';

export type CharacterParameters = {
  readonly id: string;
  readonly type: 'character';
  readonly image: string;
  readonly sentiment: CharacterSentiment | null;
  readonly results: DemographicResult[];
  readonly color: string;
  readonly showRecommendations: boolean;
};

export class CharacterRules implements Character {
  readonly id: string;

  readonly type = 'character' as const;

  readonly image: string;

  readonly nutrientTypeIds: string[];

  readonly sentiments: CharacterSentiment[];

  readonly color: string;

  readonly showRecommendations: boolean;

  readonly demographicGroups: DemographicGroup[];

  constructor(
    { id, image, nutrientTypeIds, sentiments, color, showRecommendations }: Character,
    demographicGroups: DemographicGroup[],
  ) {
    this.id = id;
    this.image = image;
    this.nutrientTypeIds = nutrientTypeIds;
    this.sentiments = sentiments;
    this.color = color;
    this.showRecommendations = showRecommendations;

    this.demographicGroups = demographicGroups;
  }

  getSentiment(
    userDemographic: UserDemographic,
    foods: AggregateFoodStats[],
  ): CharacterParameters | undefined {
    const { image, id, color, showRecommendations } = this;

    const results = this.getDemographicsGroups(userDemographic, foods);

    const scaleSectors = results
      .map(dg => dg.resultedDemographicGroup.scaleSectors)
      .reduce((a, b) => a.slice().concat(b), []);

    if (!scaleSectors.length)
      return undefined;

    const sentiment = this.pickAverageSentiment(scaleSectors);

    return { id, type: 'character', image, results, sentiment, color, showRecommendations };
  }

  private getDemographicsGroups(
    userDemographic: UserDemographic,
    foods: AggregateFoodStats[],
  ): DemographicResult[] {
    const demographicGroups = this.demographicGroups.filter(dg =>
      dg.matchesUserDemographic(userDemographic),
    );
    return demographicGroups
      .map(dg => dg.getResult(userDemographic, foods))
      .filter(dg => !!dg.resultedDemographicGroup.scaleSectors.length);
  }

  private pickAverageSentiment(scaleSectors: DemographicScaleSector[]): CharacterSentiment | null {
    if (!scaleSectors.length)
      return null;

    const dgSenEnums = scaleSectors.map(ss => ss.sentiment);
    const presentEnums = defaultSentiments.filter(en => dgSenEnums.includes(en));
    const averageEnumIndex = Math.round(
      presentEnums.map(e => defaultSentiments.indexOf(e)).reduce((a, b) => a + b)
      / presentEnums.length,
    );

    if (!presentEnums.length)
      return null;

    return this.getCharacterSentimentByDemographicSentiment(defaultSentiments[averageEnumIndex]);
  }

  private getCharacterSentimentByDemographicSentiment(
    dSentiment: Sentiment,
  ): CharacterSentiment | null {
    const charSentiments = this.sentiments.filter(s => s.sentiment.includes(dSentiment));
    return charSentiments.length ? charSentiments[0] : null;
  }
}
