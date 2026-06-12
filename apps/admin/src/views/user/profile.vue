<template>
  <div>
    <h2 class="mb-4">
      {{ $t('user.profile') }}
    </h2>
    <v-card
      v-if="profile"
      :border="!$vuetify.display.mobile"
      :flat="$vuetify.display.mobile"
      :tile="$vuetify.display.mobile"
    >
      <v-row no-gutters>
        <v-col class="pa-4 d-flex flex-column gr-4" cols="12" md="6" sm="8">
          <v-list-subheader>{{ $t('user.credentials') }}</v-list-subheader>
          <v-text-field
            v-model="profile.email"
            class="py-1"
            :label="$t('user.email')"
            readonly
          >
            <template #prepend>
              <v-avatar color="primary-darken-2" icon="fas fa-envelope" />
            </template>
            <!-- <template #append-inner>
              <v-icon
                color="primary-darken-2"
                icon="fas fa-pencil"
                :title="$t('common.action.edit')"
                @click="changeEmail"
              />
            </template> -->
          </v-text-field>
          <user-password :email="profile.email" />
        </v-col>
      </v-row>
      <v-divider />
      <v-row no-gutters>
        <v-col class="pa-4 d-flex flex-column gr-4" cols="12" md="6" sm="8">
          <v-list-subheader>{{ $t('user.info') }}</v-list-subheader>
          <v-text-field
            v-model="profile.name"
            class="py-1"
            :error-messages="errors.get('name')"
            :label="$t('user.name')"
            name="name"
            prepend-inner-icon="fas fa-user"
            @update:model-value="errors.clear('phone')"
          >
            <template #prepend>
              <v-avatar color="primary-darken-2" icon="fas fa-user" />
            </template>
          </v-text-field>
          <v-text-field
            v-model="profile.phone"
            class="py-1"
            :error-messages="errors.get('phone')"
            :label="$t('user.phone')"
            name="phone"
            prepend-inner-icon="fas fa-phone"
            @update:model-value="errors.clear('phone')"
          >
            <template #prepend>
              <v-avatar color="primary-darken-2" icon="fas fa-phone" />
            </template>
          </v-text-field>
          <v-btn
            color="primary-darken-2"
            size="large"
            type="submit"
            variant="tonal"
            @click="updateProfile"
          >
            <v-icon icon="fas fa-save" start />
            {{ $t('common.action.save') }}
          </v-btn>
        </v-col>
      </v-row>
      <v-divider />
      <v-list lines="two">
        <v-list-subheader>{{ $t('user.access') }}</v-list-subheader>
        <v-list-item>
          <template #prepend>
            <v-avatar color="primary-darken-2" icon="fas fa-users" />
          </template>
          <v-list-item-title>{{ $t('user.roles') }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ roles.length ? roles.join(', ') : '' }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template #prepend>
            <v-avatar color="primary-darken-2" icon="fas fa-eye-slash" />
          </template>
          <v-list-item-title>{{ $t('user.permissions') }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ permissions.length ? permissions.join(', ') : '' }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-row no-gutters>
        <v-col cols="12" md="6">
          <v-list lines="two">
            <v-list-subheader>{{ $t('user.settings') }}</v-list-subheader>
            <v-list-item>
              <template #prepend>
                <v-avatar color="primary-darken-2" icon="fas fa-language" />
              </template>
              <v-select
                class="py-1"
                hide-details="auto"
                item-title="englishName"
                item-value="code"
                :items="availableLanguages"
                :label="$t('user.languages._')"
                :model-value="lang"
                variant="outlined"
                @update:model-value="updateLanguage"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.englishName">
                    <template #prepend>
                      <span :class="`fi fi-${item.countryFlagCode} mr-3`" />
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <span :class="`fi fi-${item.countryFlagCode} mr-3`" />
                  {{ item.englishName }}
                </template>
              </v-select>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
      <v-divider />
      <user-mfa />
      <v-divider />
      <app-info />
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import axios, { HttpStatusCode } from 'axios';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { UserMfa, UserPassword } from '@intake24/admin/components/user';
import { useApp, useMessages, useUser } from '@intake24/admin/stores';
import { Errors } from '@intake24/common/util';
import { AppInfo, useI18n } from '@intake24/ui';

defineOptions({ name: 'UserProfile' });

const { i18n: { t } } = useI18n();

const app = useApp();
const user = useUser();

const { lang, availableLanguages } = storeToRefs(app);
const { profile, permissions, roles } = storeToRefs(user);

const errors = ref(new Errors());

async function updateLanguage(languageId: string) {
  app.setLanguage(languageId);
}

async function updateProfile() {
  if (!profile.value)
    return;

  try {
    await user.update(profile.value);
    useMessages().success(t('common.msg.updated', { name: profile.value.name }));
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
}
</script>
