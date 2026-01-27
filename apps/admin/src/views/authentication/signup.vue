<template>
  <app-entry-screen
    :subtitle="$t('common.signup.subtitle')"
    :title="$t('common.signup._')"
    width="800px"
  >
    <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="data.name"
                autocomplete="name"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('users.name')"
                name="name"
                prepend-inner-icon="fas fa-user"
                required
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="data.phone"
                autocomplete="tel"
                :error-messages="errors.get('phone')"
                hide-details="auto"
                :label="$t('common.phone')"
                name="phone"
                prepend-inner-icon="fas fa-phone"
                required
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="data.email"
                autocomplete="email"
                :error-messages="errors.get('email')"
                hide-details="auto"
                :label="$t('common.email')"
                name="email"
                prepend-inner-icon="fas fa-envelope"
                required
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="data.emailConfirm"
                autocomplete="email"
                :error-messages="errors.get('emailConfirm')"
                hide-details="auto"
                :label="$t('common.emailConfirm')"
                name="emailConfirm"
                prepend-inner-icon="fas fa-envelope"
                required
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="data.password"

                autocomplete="new-password"
                :error-messages="errors.get('password')"
                hide-details="auto"
                :label="$t('common.password._')"
                name="password"
                prepend-inner-icon="fas fa-key"
                required
                :type="show.password ? 'text' : 'password'"
                variant="outlined"
              >
                <template #append-inner>
                  <v-icon class="me-2" @click="show.password = !show.password">
                    {{ show.password ? 'fas fa-eye' : 'fas fa-eye-slash' }}
                  </v-icon>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="data.passwordConfirm"
                autocomplete="new-password"
                :error-messages="errors.get('passwordConfirm')"
                hide-details="auto"
                :label="$t('common.password.confirm')"
                name="passwordConfirm"
                prepend-inner-icon="fas fa-key"
                required
                :type="show.passwordConfirm ? 'text' : 'password'"
                variant="outlined"
              >
                <template #append-inner>
                  <v-icon class="me-2" @click="show.passwordConfirm = !show.passwordConfirm">
                    {{ show.passwordConfirm ? 'fas fa-eye' : 'fas fa-eye-slash' }}
                  </v-icon>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <v-checkbox
                v-model="data.terms"
                :error-messages="errors.get('terms')"
                hide-details="auto"
                name="terms"
                @update:model-value="errors.clear('terms')"
              >
                <template #label>
                  <i18n-t keypath="common.terms.text" tag="div">
                    <template #privacy>
                      <a href="https://intake24.org/privacy" target="_blank" @click.stop>
                        {{ $t('common.terms.privacy') }}
                      </a>
                    </template>
                    <template #tos>
                      <a href="https://intake24.org/tos" target="_blank" @click.stop>
                        {{ $t('common.terms.tos') }}
                      </a>
                    </template>
                  </i18n-t>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="12" sm="6">
              <v-btn block color="primary" :disabled="isAppLoading" rounded size="x-large" type="submit">
                {{ $t('common.signup._') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
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
import type { LoginResponse } from '@intake24/common/types/http';

import { reactive, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import { useForm } from '@intake24/admin/composables';
import { useAuth, useMessages } from '@intake24/admin/stores';
import { AppEntryScreen, Captcha, useI18n } from '@intake24/ui';

type SignUpForm = {
  name: string | null;
  phone: string | null;
  email: string | null;
  emailConfirm: string | null;
  password: string | null;
  passwordConfirm: string | null;
  terms: boolean;
  captcha: string | undefined;
};

defineOptions({ name: 'SignUp' });

const captchaEl = useTemplateRef('captchaEl');
const router = useRouter();
const { i18n: { t } } = useI18n();

const show = reactive({
  password: false,
  passwordConfirm: false,
});

const { data, errors, post } = useForm<SignUpForm>({
  data: {
    name: null,
    phone: null,
    email: null,
    emailConfirm: null,
    password: null,
    passwordConfirm: null,
    terms: false,
    captcha: undefined,
  },
});

function resetCaptcha() {
  data.value.captcha = undefined;
  captchaEl.value?.reset();
};

async function verified(token?: string) {
  data.value.captcha = token;
  await sendRequest();
};

function expired() {
  resetCaptcha();
};

async function sendRequest() {
  try {
    const { accessToken } = await post<LoginResponse>('admin/sign-up', {
      withLoading: true,
    });
    await useAuth().successfulLogin(accessToken);
    await router.push({ name: 'verify' });
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
