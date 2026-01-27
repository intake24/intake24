import type { PublicSurveyEntry } from '@intake24/common/types/http';
import type { Captcha } from '@intake24/ui';

import axios, { HttpStatusCode } from 'axios';
import { computed, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { Errors } from '@intake24/common/util';
import { surveyService } from '@intake24/survey/services';
import { useAuth, useMessages } from '@intake24/survey/stores';
import { useI18n } from '@intake24/ui';

export type UseLoginProps = {
  surveyId: string;
};

export function useLogin(props: UseLoginProps) {
  const auth = useAuth();
  const { i18n: { t } } = useI18n();
  const router = useRouter();

  const username = ref('');
  const password = ref('');
  const token = ref('');

  const showPassword = ref(false);
  const status = ref<number | null>(null);
  const survey = ref<PublicSurveyEntry | null>(null);
  const errors = ref(new Errors());

  const captchaEl = useTemplateRef<InstanceType<typeof Captcha>>('captchaEl');
  const captchaToken = ref<string | undefined>(undefined);

  const isOpenAccess = computed(() => !!survey.value?.openAccess);

  const fetchSurveyPublicInfo = async () => {
    try {
      survey.value = await surveyService.surveyPublicInfo(props.surveyId);
    }
    catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === HttpStatusCode.NotFound) {
        status.value = err.response?.status;
        return;
      }

      throw err;
    }
  };

  const resetCaptcha = () => {
    captchaToken.value = undefined;
    captchaEl.value?.reset();
  };

  const providers = {
    alias: async () => {
      await auth.login({
        username: username.value,
        password: password.value,
        survey: props.surveyId,
        captcha: captchaToken.value,
      });
      username.value = '';
      password.value = '';
      await router.push({ name: 'survey-home', params: { survey: props.surveyId } });
    },
    token: async () => {
      await auth.token({ token: token.value, captcha: captchaToken.value });
      token.value = '';
      await router.push({ name: 'survey-home', params: { survey: props.surveyId } });
    },
  };

  const login = async (provider: 'alias' | 'token') => {
    try {
      await providers[provider]();
    }
    catch (err) {
      if (
        axios.isAxiosError(err)
        && [HttpStatusCode.BadRequest, HttpStatusCode.Unauthorized].includes(err.response?.status ?? 0)
      ) {
        const { response: { status: statusCode = 0, data = {} } = {} } = err;

        status.value = statusCode;

        if (statusCode === HttpStatusCode.BadRequest && 'errors' in data)
          errors.value.record(data.errors);

        if (statusCode === HttpStatusCode.Unauthorized)
          useMessages().error(data.message ?? t('common.login.err.credentials'));

        return;
      }

      throw err;
    }
    finally {
      resetCaptcha();
    }
  };

  return {
    captchaEl,
    captchaToken,
    username,
    password,
    token,
    resetCaptcha,
    showPassword,
    status,
    survey,
    errors,
    isOpenAccess,
    fetchSurveyPublicInfo,
    login,
  };
}
