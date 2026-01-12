<template>
  <app-entry-screen
    :subtitle="$t('common.password.reset.subtitle')"
    :title="$t('common.password.reset._')"
  >
    <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
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
            <v-col cols="12">
              <v-text-field
                v-model="data.password"
                autocomplete="new-password"
                :error-messages="errors.get('password')"
                hide-details="auto"
                :label="$t('common.password._')"
                name="password"
                prepend-inner-icon="fas fa-key"
                required
                type="password"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="data.passwordConfirm"
                autocomplete="new-password"
                :error-messages="errors.get('passwordConfirm')"
                hide-details="auto"
                :label="$t('common.password.confirm')"
                name="passwordConfirm"
                prepend-inner-icon="fas fa-key"
                required
                type="password"
                variant="outlined"
              />
            </v-col>
            <error-list :errors="nonInputErrors" tag="v-col" />
          </v-row>
          <v-row justify="center">
            <v-col cols="12">
              <v-btn block color="primary" :disabled="isAppLoading" rounded size="x-large" type="submit">
                {{ $t('common.password.reset._') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
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
import { useRoute, useRouter } from 'vue-router';

import { ErrorList } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { AppEntryScreen, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

type PasswordResetForm = {
  token: string;
  email: string | null;
  password: string | null;
  passwordConfirm: string | null;
};

defineOptions({ name: 'PasswordReset' });

const route = useRoute();
const router = useRouter();
const { i18n: { t } } = useI18n();

const { data, errors, nonInputErrors, post } = useForm<PasswordResetForm>({
  data: {
    token: route.params.token.toString(),
    email: null,
    password: null,
    passwordConfirm: null,
  },
  nonInputErrorKeys: ['token'],
});

async function submit() {
  await post('password/reset');
  useMessages().success(t('common.password.changed'));
  await router.push({ name: 'login' });
};
</script>

<style lang="scss"></style>
