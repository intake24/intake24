import type { FeedbackSubmissionEntry } from '@intake24/common/types/http';
import type { UserPhysicalDataAttributes } from '@intake24/common/types/http/user';

import submissionsJson from './submissions.json';

export const physicalData: UserPhysicalDataAttributes = {
  userId: '1',
  birthdate: 1960,
  sex: 'm',
  weightKg: 80,
  heightCm: 175,
  physicalActivityLevelId: '3',
  weightTarget: 'lose_weight',
};

export const submissions = submissionsJson as unknown as FeedbackSubmissionEntry[];
