<template>
  <app-entry-screen
    :subtitle="$t('common.verify.subtitle')"
    :title="$t('common.verify._')"
  >
    <v-card-text class="px-6">
      <p class="text-subtitle-2">
        {{ $t('common.spam') }}
      </p>
      <error-list :errors="errors.getErrors()" />
    </v-card-text>
    <v-card-text class="pt-0">
      <v-container>
        <v-row justify="center">
          <v-col cols="12">
            <v-btn
              block
              color="primary"
              :disabled="isAppLoading"
              rounded
              size="x-large"
              variant="outlined"
              @click="resend"
            >
              {{ $t('common.verify.resend') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </app-entry-screen>
</template>

<script lang="ts" setup>
import axios, { HttpStatusCode } from 'axios';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ErrorList } from '@intake24/admin/components/forms';
import { useHttp } from '@intake24/admin/services';
import { useAuth, useMessages, useUser } from '@intake24/admin/stores';
import { Errors } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n/index';
import { AppEntryScreen } from '@intake24/ui';

const http = useHttp();
const { i18n: { t } } = useI18n();
const auth = useAuth();
const router = useRouter();
const route = useRoute();
const user = useUser();
const messages = useMessages();
const errors = ref(new Errors());

async function resend() {
  await http.post('admin/user/verify', {}, { withLoading: true });
  messages.info(t('common.verify.resent'));
};

async function verify(token: string) {
  try {
    await http.post('admin/sign-up/verify', { token }, { withLoading: true });
    useMessages().info(t('common.verify.verified'));

    await auth.refresh(false);
    await router.push({ name: auth.loggedIn ? 'dashboard' : 'login' });
  }
  catch (err) {
    if (axios.isAxiosError(err)) {
      const { response: { status, data = {} } = {} } = err;

      if (status === HttpStatusCode.BadRequest && 'errors' in data) {
        errors.value.record(data.errors);
        return;
      }
    }

    throw err;
  }
};

onMounted(async () => {
  const { token } = route.query;
  if (typeof token === 'string') {
    await verify(token);
    return;
  }

  if (!user.loaded)
    await auth.refresh(false);

  if (user.isVerified)
    await router.push({ name: 'dashboard' });
});
</script>

<style lang="scss"></style>
