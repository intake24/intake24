<template>
  <simple-layout>
    <v-toolbar color="surface">
      <v-toolbar-title>
        {{ $t('user.personalAccessTokens.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-dialog v-model="dialog" max-width="500px" persistent>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            color="primary"
            icon="$add"
            size="small"
            :title="$t('user.personalAccessTokens.issue')"
          />
        </template>
        <v-card :loading="false" :tile="$vuetify.display.smAndDown">
          <v-toolbar>
            <v-btn icon="$cancel" :title="$t('common.action.close')" variant="plain" @click.stop="close" />
            <v-toolbar-title>{{ $t('user.personalAccessTokens.issue') }}</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="pa-6">
            <template v-if="jwt">
              <v-alert class="mb-4" type="warning">
                {{ $t('user.personalAccessTokens.save') }}
              </v-alert>
              <v-textarea
                auto-grow
                class="mb-4"
                hide-details
                :model-value="jwt"
                name="jwt"
                readonly
                variant="outlined"
              />
              <v-btn block color="info" size="large" @click="toClipboard(jwt)">
                <v-icon icon="fas fa-clipboard" start />
                {{ $t('common.clipboard._') }}
              </v-btn>
            </template>
            <v-form v-else @keydown="clearError" @submit.prevent="submit">
              <v-text-field
                v-model="data.name"
                class="mb-4"
                :error-messages="errors.get('name')"
                :label="$t('common.name')"
                name="name"
              />
              <v-text-field
                append-icon="fas fa-calendar-alt"
                class="mb-4"
                :error-messages="errors.get('expiresAt')"
                :label="$t('common.expiresAt')"
                :model-value="formatDate(data.expiresAt, 'dd/MM/yyyy')"
                name="expiresAt"
                readonly
                @click:append="datePicker = !datePicker"
                @focusin="datePicker = true"
              />
              <v-expand-transition>
                <v-date-picker
                  v-show="datePicker"
                  v-model="data.expiresAt"
                  :error-messages="errors.get('expiresAt')"
                  name="expiresAt"
                  scrollable
                  width="auto"
                  @update:model-value="datePicker = false"
                />
              </v-expand-transition>
              <v-btn
                block
                color="primary"
                size="large"
                :title="$t('user.personalAccessTokens.issue')"
                type="submit"
              >
                {{ $t('user.personalAccessTokens.issue') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-toolbar>
    <v-divider />
    <v-list class="list-border" lines="two">
      <v-list-item
        v-for="(token, idx) in tokens"
        :key="token.id"
        :disabled="token.revoked"
        link
      >
        <template #prepend>
          <v-avatar icon="fas fa-key" />
        </template>
        <v-list-item-title>{{ token.name }}</v-list-item-title>
        <v-list-item-subtitle v-if="token.revoked">
          {{ $t('user.personalAccessTokens.revoked') }}
        </v-list-item-subtitle>
        <v-list-item-subtitle v-else>
          {{ $t('common.expiresAt') }}: {{ formatDate(token.expiresAt, 'dd/MM/yyyy') }}
        </v-list-item-subtitle>
        <template #append>
          <v-list-item-action>
            <v-btn
              v-if="token.revoked"
              color="error"
              disabled
              icon="fas fa-ban"
              :title="$t('user.personalAccessTokens.revoked')"
            />
            <confirm-dialog
              v-else
              color="error"
              icon
              icon-left="$delete"
              :label="$t('user.personalAccessTokens.revoke')"
              @confirm="revoke(idx)"
            >
              {{ $t('common.action.confirm.revoke', { name: token.name }) }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </simple-layout>
</template>

<script lang="ts" setup>
import type {
  PersonalAccessTokenResponse,
  PersonalAccessTokensResponse,
} from '@intake24/common/types/http/admin';

import { addYears } from 'date-fns';
import { onMounted, ref, watch } from 'vue';

import { SimpleLayout } from '@intake24/admin/components/layouts';
import { useDateTime, useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { useMessages } from '@intake24/admin/stores';
import { ConfirmDialog, useI18n } from '@intake24/ui';
import { useClipboard } from '@intake24/ui/composables';

defineOptions({ name: 'PersonalAccessTokens' });

const { i18n } = useI18n();

const http = useHttp();
const { formatDate } = useDateTime();
const { toClipboard } = useClipboard();

const jwt = ref('');
const tokens = ref<PersonalAccessTokenResponse[]>([]);
const dialog = ref(false);
const datePicker = ref(false);

const { clearError, data, errors, post, reset } = useForm({
  data: { name: '', expiresAt: addYears(new Date(), 1) },
});

function close() {
  dialog.value = false;
}

async function submit() {
  const data = await post<{ jwt: string; token: PersonalAccessTokenResponse }>(
    'admin/user/personal-access-tokens',
  );
  jwt.value = data.jwt;
  tokens.value.unshift(data.token);
}

async function revoke(idx: number) {
  const { id, name } = tokens.value[idx];

  await http.delete(`admin/user/personal-access-tokens/${id}`);
  tokens.value[idx].revoked = true;

  useMessages().success(i18n.t('common.msg.revoked', { name }));
}

async function getTokens() {
  const {
    data: { data },
  } = await http.get<PersonalAccessTokensResponse>('admin/user/personal-access-tokens');
  tokens.value = data;
}

watch(dialog, () => {
  reset();
  jwt.value = '';
});

onMounted(async () => {
  await getTokens();
});
</script>
