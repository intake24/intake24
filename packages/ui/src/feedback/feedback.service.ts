import type { CardWithDemGroups } from './cards-builder';
import type {
  Card,
  DemographicGroup as FeedbackSchemeDemographicGroup,
  HenryCoefficient,
} from '@intake24/common/feedback';
import type { FeedbackDataResponse, FeedbackSubmissionEntry, UserPhysicalDataResponse } from '@intake24/common/types/http';

import { useHttp } from '../services';
import { CharacterRules, DemographicGroup, SurveyStats, UserDemographic } from './classes';

export type FeedbackDictionaries = {
  feedbackData: FeedbackDataResponse;
  cards: CardWithDemGroups[];
  demographicGroups: DemographicGroup[];
  surveyStats: SurveyStats;
};

export type FeedbackResults = {
  feedbackDicts: FeedbackDictionaries;
  userDemographic: UserDemographic;
};

export type UserPhysicalData = NonNullable<UserPhysicalDataResponse>;

function createFeedbackService() {
  const http = useHttp();

  let cachedFeedbackData: FeedbackDataResponse | null = null;
  let cachedSubmissions: FeedbackSubmissionEntry[] = [];

  const fetchFeedbackData = async (): Promise<FeedbackDataResponse> => {
    const { data } = await http.get<FeedbackDataResponse>('feedback');
    return data;
  };

  const getFeedbackData = async (): Promise<FeedbackDataResponse> => {
    if (cachedFeedbackData)
      return cachedFeedbackData;

    const data = await fetchFeedbackData();
    cachedFeedbackData = data;

    return data;
  };

  const getUserDemographic = (
    feedbackData: FeedbackDataResponse,
    henryCoefficients: HenryCoefficient[],
    physicalData: UserPhysicalData,
  ): UserDemographic => {
    const { physicalActivityLevels, weightTargets } = feedbackData;

    const physicalActivityLevel = physicalActivityLevels.find(
      ({ id }) => id === physicalData.physicalActivityLevelId,
    );
    const weightTarget = weightTargets.find(({ id }) => id === physicalData.weightTarget);

    return new UserDemographic(
      physicalData,
      henryCoefficients,
      physicalActivityLevel,
      weightTarget,
    );
  };

  const getFeedbackResults = async (ops: {
    cards: Card[];
    groups: FeedbackSchemeDemographicGroup[];
    henryCoefficients: HenryCoefficient[];
    physicalData: UserPhysicalData;
    submissions: FeedbackSubmissionEntry[];
  }): Promise<FeedbackResults> => {
    const { cards, groups, henryCoefficients, physicalData } = ops;

    cachedSubmissions &&= ops.submissions;

    const feedbackData = await getFeedbackData();
    const surveyStats = SurveyStats.fromJson(cachedSubmissions);

    const demographicGroups = groups.reduce<DemographicGroup[]>((acc, item) => {
      const nutrientType = feedbackData.nutrientTypes.find(nt => nt.id === item.nutrientTypeId);

      const group = DemographicGroup.fromJson(item, nutrientType);
      acc.push(group);

      return acc;
    }, []);

    const cardWithDemGroups: CardWithDemGroups[] = cards.map((card) => {
      switch (card.type) {
        case 'character':
          return new CharacterRules(
            card,
            demographicGroups.filter(
              group =>
                group.type === card.type
                && group.nutrient
                && card.nutrientTypeIds.includes(group.nutrient.id),
            ),
          );
        case 'nutrient-group':
          return {
            ...card,
            demographicGroups: demographicGroups.filter(
              group =>
                group.type === card.type
                && (!group.nutrient || card.nutrientTypes.includes(group.nutrient.id)),
            ),
          };
        default:
          return {
            ...card,
            demographicGroups: demographicGroups.filter(group => group.type === card.type),
          };
      }
    });

    const feedbackDicts = {
      feedbackData,
      cards: cardWithDemGroups,
      demographicGroups,
      surveyStats,
    };

    const userDemographic = getUserDemographic(feedbackData, henryCoefficients, physicalData);

    return {
      feedbackDicts,
      userDemographic,
    };
  };

  return {
    fetchFeedbackData,
    getFeedbackData,
    getUserDemographic,
    getFeedbackResults,
  };
}

export default createFeedbackService;

export type FeedbackService = ReturnType<typeof createFeedbackService>;
