<template>
  <v-container :class="{ 'pa-0': $vuetify.display.mobile }">
    <v-row class="justify-center" :no-gutters="$vuetify.display.mobile">
      <v-col cols="12" md="8" sm="9">
        <v-card v-if="profile" :tile="$vuetify.display.mobile">
          <v-list lines="two">
            <v-list-subheader>{{ $t('profile.info') }}</v-list-subheader>
            <v-list-item>
              <template #prepend>
                <v-avatar color="secondary" icon="fas fa-user" />
              </template>
              <v-list-item-title>{{ $t('common.name') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ user?.name || $t('common.not.provided') }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-avatar color="secondary" icon="fas fa-id-badge" />
              </template>
              <v-list-item-title>{{ $t('profile.provider') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ profile.subject.provider || $t('common.not.provided') }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-avatar color="secondary" icon="fas fa-key" />
              </template>
              <v-list-item-title>{{ $t('profile.providerId') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ profile.subject.providerKey || $t('common.not.provided') }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-divider />
          <v-list lines="two">
            <v-list-subheader>{{ $t('profile.settings') }}</v-list-subheader>
            <v-list-item>
              <template #prepend>
                <v-avatar color="secondary" icon="fas fa-language" />
              </template>
              <v-select
                class="py-1"
                hide-details="auto"
                item-title="englishName"
                item-value="code"
                :items="languages"
                :label="$t('profile.languages._')"
                :model-value="language"
                variant="outlined"
                @update:model-value="updateLanguage"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.englishName">
                    <template #prepend>
                      <span :class="`fi fi-${item.countryFlagCode} me-3`" />
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <span :class="`fi fi-${item.countryFlagCode} me-3`" />
                  {{ item.englishName }}
                </template>
              </v-select>
            </v-list-item>
          </v-list>
          <v-divider />
          <app-info />
          <v-card-text class="mt-6 d-flex justify-center">
            <confirm-dialog :label="$t('common.logout._')" @confirm="logout">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :block="$vuetify.display.mobile"
                  class="px-10"
                  color="primary"
                  rounded
                  size="x-large"
                  variant="outlined"
                >
                  <span class="me-2">{{ $t('common.logout._') }}</span>
                  <v-icon end>
                    $logout
                  </v-icon>
                </v-btn>
              </template>
              {{ $t('common.logout.text') }}
            </confirm-dialog>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { mapState } from 'pinia';
import { computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';

import { useApp, useAuth, useSurvey, useUser } from '@intake24/survey/stores';
import { AppInfo, ConfirmDialog } from '@intake24/ui';

export default defineComponent({
  name: 'SurveyUserProfile',

  components: { AppInfo, ConfirmDialog },

  props: {
    surveyId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const app = useApp();
    const router = useRouter();

    const language = computed(() => app.lang);
    const languages = computed(() => app.availableLanguages);

    const updateLanguage = async (languageId: string) => {
      useApp().setLanguage(languageId);
    };

    const logout = async () => {
      await useAuth().logout(true);
      const { surveyId } = props;
      await router.push(
        surveyId ? { name: 'survey-login', params: { surveyId } } : { name: 'home' },
      );
    };

    return {
      language,
      languages,
      logout,
      updateLanguage,
    };
  },

  computed: {
    ...mapState(useUser, ['profile']),
    ...mapState(useSurvey, ['user']),
  },
});
</script>
