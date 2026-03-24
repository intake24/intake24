import type { NavigationGuard } from 'vue-router';

import { HttpStatusCode, isAxiosError } from 'axios';

import { surveyService } from '../services';
import { useAuth, useSurvey, useUser } from '../stores';

export const feedbackParametersGuard: NavigationGuard = async (to) => {
  const {
    meta: { module } = {},
    params: { surveyId },
  } = to;

  const auth = useAuth();
  const survey = useSurvey();

  try {
    if (!survey.parametersLoaded)
      await survey.loadParameters(surveyId.toString());
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === HttpStatusCode.Forbidden) {
      await auth.logout(true);
      return { name: 'survey-login', params: { surveyId } };
    }
    throw error;
  }

  if (!survey.parametersLoaded)
    return { name: `${module}-error`, params: { surveyId } };

  if (!survey.user?.showFeedback)
    return { name: 'survey-home', params: { surveyId } };
};

export const surveyParametersGuard: NavigationGuard = async (to) => {
  const {
    meta: { module } = {},
    params: { surveyId },
  } = to;

  const auth = useAuth();
  const survey = useSurvey();

  try {
    if (!survey.parametersLoaded)
      await survey.loadParameters(surveyId.toString());
  }
  catch (error) {
    if (isAxiosError(error) && error.response?.status === HttpStatusCode.Forbidden) {
      await auth.logout(true);
      return { name: 'survey-login', params: { surveyId } };
    }
    throw error;
  }

  if (!survey.parametersLoaded)
    return { name: `${module}-error`, params: { surveyId } };
};

export const surveyParametersErrorGuard: NavigationGuard = async (to) => {
  const {
    meta: { module } = {},
    params: { surveyId },
  } = to;

  if (useSurvey().parametersLoaded)
    return { name: `${module}-home`, params: { surveyId } };
};

export const authGuard: NavigationGuard = async (to) => {
  const {
    params: { token },
  } = to;

  try {
    const auth = useAuth();
    await auth.logout(true);
    await auth.token({ token: token.toString() });

    if (auth.loggedIn) {
      const surveyId = useUser().profile?.surveyId;
      return surveyId ? { name: 'survey-home', params: { surveyId } } : { name: 'home' };
    }

    if (auth.challenge) {
      return {
        name: 'survey-challenge',
        params: { surveyId: auth.challenge.surveyId },
        query: { auth: token },
      };
    }

    throw new Error('Unexpected error during authentication.');
  }
  catch {
    return { name: 'home' };
  }
};

export const createUserGuard: NavigationGuard = async (to) => {
  const {
    params: { surveyId, token },
    query: { redirect },
  } = to;

  try {
    const { authToken } = await surveyService.createUser(surveyId.toString(), token.toString());
    const auth = useAuth();
    await auth.logout(true);
    await auth.token({ token: authToken });

    const view = typeof redirect === 'string' && ['home', 'recall', 'feedback'].includes(redirect) ? redirect : 'home';
    return { path: `${surveyId}/${view}` };
  }
  catch {
    return { name: 'home' };
  }
};

export const globalGuard: NavigationGuard = async (to) => {
  const {
    meta: { module } = {},
    query: { auth: token, ...query },
  } = to;
  let {
    params: { surveyId },
  } = to;

  const auth = useAuth();

  // Public pages
  if (module === 'public')
    return true;

  // Try logging-in if we have authentication token
  if (typeof token === 'string' && token && !auth.loggedIn && !auth.challenge) {
    try {
      await auth.logout(true);
      await auth.token({ token });

      if (auth.loggedIn) {
        surveyId = useUser().profile?.surveyId ?? surveyId;
        return { name: to.name ?? 'survey-home', params: { surveyId }, query };
      }

      if (auth.challenge) {
        return {
          name: 'survey-challenge',
          // @ts-expect-error TS doesn't narrow type based on store change
          params: { surveyId: auth.challenge.surveyId },
          query: { auth: token },
        };
      }
    }
    catch {
      return { name: surveyId ? 'survey-login' : 'home', params: { surveyId } };
    }
  }

  // Login pages (credentials / token)
  if (module === 'login') {
    if (auth.loggedIn)
      return { name: 'survey-home', params: { surveyId: useUser().profile?.surveyId ?? surveyId } };
    else
      return true;
  }

  // Get logged-in user information if not yet loaded
  if (!auth.loggedIn)
    await auth.refresh(false);

  // Any other page (requires to be logged in)
  if (!auth.loggedIn) {
    if (surveyId)
      return { name: 'survey-login', params: { surveyId } };
    else
      return { name: 'home' };
  }
};
