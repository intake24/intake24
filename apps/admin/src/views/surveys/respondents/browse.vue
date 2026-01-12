<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <embedded-data-table
      ref="table"
      :api-url="`admin/surveys/${id}/respondents`"
      :headers="headers"
      track-by="userId"
    >
      <template #header-add>
        <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
          <template #activator="{ props }">
            <v-btn class="font-weight-bold" color="secondary" variant="text" v-bind="props">
              <v-icon icon="fas fa-user-plus" start />{{ $t('surveys.respondents.add') }}
            </v-btn>
          </template>
          <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
            <v-toolbar color="secondary">
              <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
              <v-toolbar-title>
                {{ $t(`surveys.respondents.${isCreate ? 'add' : 'edit'}`) }}
              </v-toolbar-title>
            </v-toolbar>
            <v-form autocomplete="off" @keydown="clearError" @submit.prevent="saveRespondent">
              <v-card-title>
                {{ $t('users.identifiers.title') }}
              </v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="data.username"
                  autocomplete="username"
                  class="mb-4"
                  :disabled="!isCreate"
                  :error-messages="errors.get('username')"
                  hide-details="auto"
                  :label="$t('users.username')"
                  name="username"
                  prepend-inner-icon="fas fa-user-secret"
                  variant="outlined"
                />
                <v-text-field
                  v-model="data.password"
                  autocomplete="new-password"
                  class="mb-4"
                  :error-messages="errors.get('password')"
                  hide-details="auto"
                  :label="$t('common.password._')"
                  name="password"
                  prepend-inner-icon="fas fa-unlock"
                  type="password"
                  variant="outlined"
                />
                <v-text-field
                  v-model="data.passwordConfirm"
                  autocomplete="new-password"
                  :error-messages="errors.get('passwordConfirm')"
                  hide-details="auto"
                  :label="$t('common.password.confirm')"
                  name="passwordConfirm"
                  prepend-inner-icon="fas fa-unlock"
                  type="password"
                  variant="outlined"
                />
              </v-card-text>
              <template v-if="entry.userPersonalIdentifiers">
                <v-card-title>
                  {{ $t('users.personalIdentifiers.title') }}
                </v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model="data.name"
                    class="mb-4"
                    :error-messages="errors.get('name')"
                    hide-details="auto"
                    :label="$t('users.name')"
                    name="name"
                    prepend-inner-icon="fas fa-user"
                    variant="outlined"
                  />
                  <v-text-field
                    v-model="data.email"
                    class="mb-4"
                    :error-messages="errors.get('email')"
                    hide-details="auto"
                    :label="$t('common.email')"
                    name="email"
                    prepend-inner-icon="fas fa-at"
                    variant="outlined"
                  />
                  <v-text-field
                    v-model="data.phone"
                    :error-messages="errors.get('phone')"
                    hide-details="auto"
                    :label="$t('common.phone')"
                    name="phone"
                    prepend-inner-icon="fas fa-phone"
                    variant="outlined"
                  />
                </v-card-text>
              </template>
              <template v-if="entry.userCustomFields">
                <v-toolbar flat tile>
                  <div class="font-weight-medium">
                    {{ $t('users.customFields.title') }}
                  </div>
                  <v-spacer />
                  <v-btn color="primary" icon="$add" size="small" :title="$t('users.customFields.add')" @click.stop="addCustomField" />
                </v-toolbar>
                <v-card-text>
                  <template v-for="(field, idx) in data.customFields" :key="`r-${idx}`">
                    <v-row dense>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="field.name"
                          density="compact"
                          :error-messages="errors.get(`customFields.${idx}.name`)"
                          hide-details="auto"
                          :label="$t('users.customFields.name')"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="8">
                        <v-text-field
                          v-model="field.value"
                          density="compact"
                          :error-messages="errors.get(`customFields.${idx}.value`)"
                          hide-details="auto"
                          :label="$t('users.customFields.value')"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>
                    <v-row dense justify="space-between">
                      <v-col cols="auto">
                        <v-checkbox-btn v-model="field.public" hide-details="auto" :label="$t('users.customFields.public')" />
                      </v-col>
                      <v-col cols="auto">
                        <v-btn color="error" :title="$t('users.customFields.remove')" variant="text" @click.stop="removeCustomField(idx)">
                          <v-icon color="error" start>
                            $delete
                          </v-icon>
                          {{ $t('common.action.remove') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </template>
                </v-card-text>
              </template>
              <v-divider />
              <v-card-actions>
                <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
                  <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
                  <v-icon icon="$save" start />{{ $t('common.action.save') }}
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card>
        </v-dialog>
        <v-menu close-on-content-click :persistent="false">
          <template #activator="{ props }">
            <v-btn class="font-weight-bold" color="secondary" icon="$options" v-bind="props" variant="text" />
          </template>
          <v-list>
            <respondents-upload :survey-id="id" />
            <respondents-auth-url-export :survey-id="id" />
          </v-list>
        </v-menu>
      </template>
      <template #[`item.surveyAuthUrl`]="{ item }">
        <v-btn :href="item.surveyAuthUrl" icon target="_blank">
          <v-icon>fas fa-arrow-up-right-from-square</v-icon>
        </v-btn>
        <v-btn icon="fas fa-clipboard" @click="toClipboard(item.surveyAuthUrl)" />
      </template>
      <template #[`item.feedbackAuthUrl`]="{ item }">
        <v-btn :href="item.feedbackAuthUrl" icon target="_blank">
          <v-icon>fas fa-arrow-up-right-from-square</v-icon>
        </v-btn>
        <v-btn icon="fas fa-clipboard" @click="toClipboard(item.feedbackAuthUrl)" />
      </template>
      <template #[`item.action`]="{ item }">
        <v-menu close-on-content-click :persistent="false">
          <template #activator="{ props }">
            <v-btn class="font-weight-bold" color="secondary" icon="$options" v-bind="props" />
          </template>
          <v-list>
            <respondent-feedback :survey-id="id" :user="item" />
          </v-list>
        </v-menu>
        <v-btn color="secondary" icon="$edit" :title="$t('common.action.edit')" @click.stop="editRespondent(item)" />
        <confirm-dialog
          color="error"
          icon
          icon-left="$delete"
          :label="$t('common.action.delete')"
          @confirm="removeRespondent(item)"
        >
          {{ $t('common.action.confirm.delete', { name: item.username }) }}
        </confirm-dialog>
      </template>
    </embedded-data-table>
  </layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';

import { EmbeddedDataTable } from '@intake24/admin/components/data-tables';
import type { DataTableHeader } from '@intake24/admin/components/data-tables';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import type { UserCustomField } from '@intake24/common/types';
import type {
  RespondentEntry,
  RespondentListEntry,
  SurveyEntry,
} from '@intake24/common/types/http/admin';
import { ConfirmDialog, useClipboard, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

import RespondentFeedback from './respondent-feedback.vue';
import RespondentsAuthUrlExport from './respondents-auth-url-export.vue';
import RespondentsUpload from './respondents-upload.vue';

export type SurveyRespondentsForm = {
  userId: string | null;
  username: string | null;
  password: string | null;
  passwordConfirm: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  customFields: UserCustomField[];
};

export default defineComponent({
  name: 'SurveyRespondents',

  components: {
    ConfirmDialog,
    EmbeddedDataTable,
    RespondentFeedback,
    RespondentsAuthUrlExport,
    RespondentsUpload,
  },

  mixins: [detailMixin],

  setup(props) {
    const dialog = ref(false);
    const loading = ref(false);

    const http = useHttp();
    const { i18n } = useI18n();
    const clipboard = useClipboard();

    async function toClipboard(data: string) {
      await clipboard.toClipboard(
        data,
        i18n.t('surveys.respondents.authUrls.copiedToClipboard'),
      );
    }

    const headers: DataTableHeader[] = [
      {
        title: i18n.t('users.aliases.username'),
        sortable: true,
        key: 'username',
        align: 'start',
      },
      {
        title: i18n.t('users.aliases.urlAuthToken'),
        sortable: false,
        key: 'urlAuthToken',
        align: 'start',
      },
      {
        title: i18n.t('surveys.respondents.authUrls.surveyAuthUrl'),
        sortable: false,
        key: 'surveyAuthUrl',
        align: 'start',
      },
      {
        title: i18n.t('surveys.respondents.authUrls.feedbackAuthUrl'),
        sortable: false,
        key: 'feedbackAuthUrl',
        align: 'start',
      },
      {
        title: i18n.t('common.action._'),
        sortable: false,
        key: 'action',
        align: 'end',
      },
    ];

    const { entry, entryLoaded } = useEntry<SurveyEntry>(props);
    useEntryFetch(props);

    const { data, errors, clearError, load, post, patch, reset: resetForm } = useForm<SurveyRespondentsForm>({
      data: {
        userId: null,
        username: null,
        password: null,
        passwordConfirm: null,
        name: null,
        email: null,
        phone: null,
        customFields: [],
      },
    });
    const table = ref<InstanceType<typeof EmbeddedDataTable>>();

    const isCreate = computed(() => !data.value.userId);

    function addCustomField() {
      const size = data.value.customFields.length + 1;
      data.value.customFields.push({ name: `name-${size}`, value: `value-${size}` });
    };

    function removeCustomField(index: number) {
      data.value.customFields.splice(index, 1);
    };

    async function fetchRespondent(username: string) {
      const { data } = await http.get<RespondentEntry>(
        `admin/surveys/${props.id}/respondents/${username}`,
      );

      return data;
    };

    function addRespondent() {
      reset();
      dialog.value = true;
    };

    async function editRespondent(item: RespondentListEntry) {
      loading.value = true;
      dialog.value = true;

      try {
        const user = await fetchRespondent(item.username);
        load(user);
      }
      finally {
        loading.value = false;
      }
    };

    function reset() {
      resetForm();
      dialog.value = false;
    };

    async function updateTable() {
      await table.value?.fetch();
    };

    async function saveRespondent() {
      if (data.value.userId) {
        const { username: name } = await patch<RespondentEntry>(
          `admin/surveys/${props.id}/respondents/${data.value.username}`,
        );

        useMessages().success(i18n.t('common.msg.updated', { name }));
      }
      else {
        const { username: name } = await post<RespondentEntry>(
          `admin/surveys/${props.id}/respondents`,
        );

        useMessages().success(i18n.t('common.msg.created', { name }));
      }

      dialog.value = false;
      await updateTable();
    };

    async function removeRespondent({ username: name }: RespondentListEntry) {
      await http.delete(`admin/surveys/${props.id}/respondents/${name}`);
      useMessages().success(i18n.t('common.msg.deleted', { name }));

      await updateTable();
    };

    return {
      addCustomField,
      addRespondent,
      dialog,
      editRespondent,
      isCreate,
      headers,
      loading,
      entry,
      entryLoaded,
      table,
      data,
      errors,
      clearError,
      removeCustomField,
      removeRespondent,
      reset,
      saveRespondent,
      toClipboard,
    };
  },
});
</script>

<style lang="scss" scoped></style>
