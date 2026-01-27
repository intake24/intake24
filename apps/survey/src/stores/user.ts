import type { Subject, SurveyTokenPayload } from '@intake24/common/security';

import { defineStore } from 'pinia';

import { tokenService } from '@intake24/ui';

import { useSurvey } from './survey';

export type UserState = {
  profile: {
    surveyId: string;
    userId: string;
    subject: Subject;
  } | null;
};

export const useUser = defineStore('user', {
  state: (): UserState => ({
    profile: null,
  }),
  getters: {
    userId: state => state.profile?.userId,
    loaded: state => !!state.profile,
  },
  actions: {
    load(accessToken: string) {
      const { surveyId, userId, sub } = tokenService.decodeAccessToken<SurveyTokenPayload>(
        accessToken,
        'survey',
      );

      this.profile = { surveyId, userId, subject: JSON.parse(atob(sub)) };

      const survey = useSurvey();
      if (userId !== survey.user?.userId)
        survey.clearState();
    },
  },
});

export type UserStoreDef = typeof useUser;

export type UserStore = ReturnType<UserStoreDef>;
