import type { NavigationGuard } from 'vue-router';
import { HttpStatusCode, isAxiosError } from 'axios';
import { surveyService } from '../services';
import { useAuth, useSurvey, useUser } from '../stores';

export const faqsGuard: NavigationGuard = async (to, from, next) => {
  if (useSurvey().faqsEnabled)
    next();
  else
    next(from);
};

export const feedbackParametersGuard: NavigationGuard = async (to, from, next) => {
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
      next({ name: 'survey-login', params: { surveyId } });
      return;
    }
    throw error;
  }

  if (!survey.parametersLoaded) {
    next({ name: `${module}-error`, params: { surveyId } });
    return;
  }

  if (!survey.user?.showFeedback) {
    next({ name: 'survey-home', params: { surveyId } });
    return;
  }

  next();
};

export const surveyParametersGuard: NavigationGuard = async (to, from, next) => {
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
      next({ name: 'survey-login', params: { surveyId } });
      return;
    }
    throw error;
  }

  if (!survey.parametersLoaded) {
    next({ name: `${module}-error`, params: { surveyId } });
    return;
  }

  next();
};

export const surveyParametersErrorGuard: NavigationGuard = async (to, from, next) => {
  const {
    meta: { module } = {},
    params: { surveyId },
  } = to;

  if (useSurvey().parametersLoaded) {
    next({ name: `${module}-home`, params: { surveyId } });
    return;
  }

  next();
};

export const authGuard: NavigationGuard = async (to, from, next) => {
  const {
    params: { token },
  } = to;

  try {
    const auth = useAuth();
    await auth.logout(true);
    await auth.token({ token: token.toString() });

    if (auth.loggedIn) {
      const surveyId = useUser().profile?.surveyId;
      next(surveyId ? { name: 'survey-home', params: { surveyId } } : { name: 'home' });
      return;
    }

    if (auth.challenge) {
      next({
        name: 'survey-challenge',
        params: { surveyId: auth.challenge.surveyId },
        query: { auth: token },
      });
      return;
    }

    throw new Error('Unexpected error during authentication.');
  }
  catch {
    next({ name: 'home' });
  }
};

export const createUserGuard: NavigationGuard = async (to, from, next) => {
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
    next({ path: `${surveyId}/${view}` });
  }
  catch {
    next({ name: 'home' });
  }
};

export const globalGuard: NavigationGuard = async (to, from, next) => {
  const {
    meta: { module } = {},
    query: { auth: token, ...query },
  } = to;
  let {
    params: { surveyId },
  } = to;

  const auth = useAuth();

  // Public pages
  if (module === 'public') {
    next();
    return;
  }

  // Try logging-in if we have authentication token
  if (typeof token === 'string' && token && !auth.loggedIn && !auth.challenge) {
    try {
      await auth.logout(true);
      await auth.token({ token });

      if (auth.loggedIn) {
        surveyId = useUser().profile?.surveyId ?? surveyId;
        next({ name: to.name ?? 'survey-home', params: { surveyId }, query });
        return;
      }

      if (auth.challenge) {
        next({
          name: 'survey-challenge',
          // @ts-expect-error TS doesn't narrow type based on store change
          params: { surveyId: auth.challenge.surveyId },
          query: { auth: token },
        });
        return;
      }
    }
    catch {
      next({ name: surveyId ? 'survey-login' : 'home', params: { surveyId } });
      return;
    }
  }

  // Login pages (credentials / token)
  if (module === 'login') {
    if (auth.loggedIn)
      next({ name: 'survey-home', params: { surveyId: useUser().profile?.surveyId ?? surveyId } });
    else next();
    return;
  }

  // Get logged-in user information if not yet loaded
  if (!auth.loggedIn)
    await auth.refresh(false);

  // Any other page (requires to be logged in)
  if (!auth.loggedIn) {
    if (surveyId)
      next({ name: 'survey-login', params: { surveyId } });
    else next({ name: 'home' });
    return;
  }

  next();
};
