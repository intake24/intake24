<template>
  <app-entry-screen
    :subtitle="$t('common.password.request.subtitle')"
    :title="$t('common.password.request._')"
  >
    <v-card-text v-if="submitted" class="pa-6">
      <p class="text-h5 ma-4">
        {{ $t('common.password.request.sent') }}
      </p>
      <p class="text-subtitle-2 ma-4">
        {{ $t('common.spam') }}
      </p>
    </v-card-text>
    <v-form v-else @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
      <v-card-text class="pa-6 d-flex flex-column gr-4">
        <v-text-field
          v-model="data.email"
          :error-messages="errors.get('email')"
          hide-details="auto"
          :label="$t('common.email')"
          name="email"
          prepend-inner-icon="fas fa-envelope"
          required
          variant="outlined"
        />
        <v-btn block color="primary" :disabled="isAppLoading" rounded size="x-large" type="submit">
          {{ $t('common.password.request.send') }}
        </v-btn>
      </v-card-text>
      <captcha ref="captchaEl" @expired="expired" @verified="verified" />
    </v-form>
    <v-card-actions>
      <v-btn color="info" exact :to="{ name: 'login' }" variant="text">
        <v-icon icon="fas fa-angles-left" start />
        {{ $t('common.login.back') }}
      </v-btn>
    </v-card-actions>
  </app-entry-screen>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import { useForm } from '@intake24/admin/composables';
import { AppEntryScreen, Captcha, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

type PasswordRequestForm = {
  email: string | null;
  captcha: string | undefined;
};

defineOptions({ name: 'PasswordRequest' });

const { i18n: { t } } = useI18n();
const captchaEl = useTemplateRef('captchaEl');
const submitted = ref(false);

const { data, errors, post } = useForm<PasswordRequestForm>({
  data: {
    email: null,
    captcha: undefined,
  },
});

function resetCaptcha() {
  data.value.captcha = undefined;
  captchaEl.value?.reset();
};

async function verified(token: string) {
  data.value.captcha = token;
  await sendRequest();
};

function expired() {
  resetCaptcha();
};

async function sendRequest() {
  try {
    await post('password');
    submitted.value = true;
  }
  catch (err) {
    if (errors.has('captcha')) {
      errors.clear('captcha');
      useMessages().error(t('common.password.request.captcha'));
    }
    else {
      throw err;
    }
  }
  finally {
    resetCaptcha();
  }
};

async function submit() {
  if (captchaEl.value) {
    captchaEl.value.executeIfCan();
    return;
  }

  await sendRequest();
};
</script>

<style lang="scss"></style>
