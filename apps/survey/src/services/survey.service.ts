import type { SurveyState } from '@intake24/common/surveys';
import type {
  CreateUserResponse,
  GenerateUserResponse,
  PublicSurveyEntry,
  SurveyEntryResponse,
  SurveyFAQs,
  SurveyHelpRequest,
  SurveyRatingRequest,
  SurveySubmissionResponse,
  SurveyUserInfoResponse,
  SurveyUserSessionResponse,
} from '@intake24/common/types/http';
import http from './http.service';

export type GenerateUserPayload = {
  captcha?: string;
};

export default {
  createUser: async (surveyId: string, token: string): Promise<CreateUserResponse> => {
    const { data } = await http.post<CreateUserResponse>(`surveys/${surveyId}/create-user`, {
      token,
    });

    return data;
  },

  generateUser: async (surveyId: string, payload: GenerateUserPayload): Promise<GenerateUserResponse> => {
    const { data } = await http.post<GenerateUserResponse>(
      `surveys/${surveyId}/generate-user`,
      payload,
    );

    return data;
  },

  surveyFAQs: async (surveyId: string): Promise<SurveyFAQs> => {
    const { data } = await http.get<SurveyFAQs>(`surveys/${surveyId}/faqs`);

    return data;
  },

  surveyPublicList: async (): Promise<PublicSurveyEntry[]> => {
    const { data } = await http.get<PublicSurveyEntry[]>(`surveys`);

    return data;
  },

  surveyPublicInfo: async (surveyId: string): Promise<PublicSurveyEntry> => {
    const { data } = await http.get<PublicSurveyEntry>(`surveys/${surveyId}`);

    return data;
  },

  surveyInfo: async (surveyId: string): Promise<SurveyEntryResponse> => {
    const { data } = await http.get<SurveyEntryResponse>(`surveys/${surveyId}/parameters`);

    return data;
  },

  userInfo: async (surveyId: string): Promise<SurveyUserInfoResponse> => {
    const tzOffset = new Date().getTimezoneOffset();

    const { data } = await http.get<SurveyUserInfoResponse>(`surveys/${surveyId}/user-info`, {
      params: { tzOffset },
    });

    return data;
  },

  getUserSession: async (surveyId: string): Promise<SurveyUserSessionResponse | undefined> => {
    try {
      const { data } = await http.get<SurveyUserSessionResponse>(`surveys/${surveyId}/session`);
      return data;
    }
    catch {
      return undefined;
    }
  },

  startUserSession: async (surveyId: string, session: SurveyState) => {
    await http.post(`surveys/${surveyId}/session`, { session });
  },

  saveUserSession: async (surveyId: string, session: SurveyState) => {
    await http.put(`surveys/${surveyId}/session`, { session });
  },

  clearUserSession: async (surveyId: string, sessionId?: string) => {
    await http.delete(sessionId ? `surveys/${surveyId}/session/${sessionId}` : `surveys/${surveyId}/session`);
  },

  submit: async (surveyId: string, submission: SurveyState): Promise<SurveySubmissionResponse> => {
    const tzOffset = new Date().getTimezoneOffset();

    const { data } = await http.post<SurveySubmissionResponse>(
      `surveys/${surveyId}/submission`,
      { submission },
      { params: { tzOffset } },
    );

    return data;
  },

  requestHelp: async (surveyId: string, payload: SurveyHelpRequest) =>
    http.post(`surveys/${surveyId}/request-help`, payload),

  storeRating: async (surveyId: string, payload: SurveyRatingRequest) =>
    http.post(`surveys/${surveyId}/rating`, payload),
};
