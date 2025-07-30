<template>
  <v-app :class="{ mobile: $vuetify.display.mobile }">
    <loader :show="isAppLoading" />
    <v-navigation-drawer v-model="sidebar">
      <template v-if="loggedIn && surveyId">
        <v-list>
          <v-list-item link :to="{ name: 'survey-profile', params: { surveyId } }">
            <template #prepend>
              <v-icon color="info" icon="fas fa-circle-user" size="30" />
            </template>
            <v-list-item-title class="font-weight-medium text-h6">
              {{ userName ?? $t('profile._') }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider />
      </template>
      <v-list density="compact" nav>
        <v-list-item
          link
          :to="
            loggedIn && surveyId
              ? { name: 'survey-home', params: { surveyId } }
              : { name: 'home' }
          "
        >
          <template #prepend>
            <v-icon icon="$home" />
          </template>
          <v-list-item-title>{{ $t('common.home') }}</v-list-item-title>
        </v-list-item>
        <template v-if="loggedIn && surveyId">
          <v-list-item
            v-if="recallAllowed"
            link
            :to="{ name: 'survey-recall', params: { surveyId } }"
          >
            <template #prepend>
              <v-icon icon="$survey" />
            </template>
            <v-list-item-title>{{ $t('recall._') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="feedbackAllowed"
            link
            :to="{ name: 'feedback-home', params: { surveyId } }"
          >
            <template #prepend>
              <v-icon icon="$feedback" />
            </template>
            <v-list-item-title>{{ $t('feedback._') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="faqsEnabled"
            link
            :to="{ name: 'faqs', params: { surveyId } }"
          >
            <template #prepend>
              <v-icon icon="$faqs" />
            </template>
            <v-list-item-title>{{ $t('common.faqs._') }}</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
      <template #append>
        <div v-if="loggedIn" class="pa-2">
          <confirm-dialog
            :label="$t('common.logout._')"
            @confirm="logout"
          >
            <template #activator="{ props }">
              <v-btn v-bind="props" block color="grey-darken-2" rounded variant="tonal">
                <v-icon icon="$logout" start />
                <span class="me-2">{{ $t('common.logout._') }}</span>
              </v-btn>
            </template>
            {{ $t('common.logout.text') }}
          </confirm-dialog>
        </div>
        <app-nav-footer :contact="showContact" />
      </template>
    </v-navigation-drawer>
    <v-app-bar color="primary" flat scroll-behavior="hide">
      <v-app-bar-nav-icon :title="$t('common.navigation')" @click.stop="toggleSidebar" />
      <template v-if="loggedIn">
        <div v-if="surveyName" class="app-bar-survey-info">
          <i18n-t keypath="recall.survey" tag="span">
            <template #name>
              <span class="font-weight-medium">{{ surveyName }}</span>
            </template>
          </i18n-t>
          <template v-if="recallAllowed">
            <v-divider v-if="$vuetify.display.smAndUp" class="bg-grey mx-4" vertical />
            <i18n-t keypath="recall.submissions.count" tag="span">
              <template #count>
                <span class="font-weight-medium">{{ recallNumber }}</span>
              </template>
            </i18n-t>
          </template>
        </div>
        <v-spacer v-if="$vuetify.display.smAndUp" />
        <v-btn
          v-if="surveyId && !$vuetify.display.mobile"
          :icon="$vuetify.display.mobile"
          :size="$vuetify.display.mobile ? 'large' : undefined"
          :title="$t('profile._')"
          :to="{ name: 'survey-profile', params: { surveyId } }"
          :variant="!$vuetify.display.mobile ? 'text' : undefined"
        >
          <span v-if="!$vuetify.display.mobile" class="me-2">{{ $t('profile._') }}</span>
          <v-icon>$profile</v-icon>
        </v-btn>
        <confirm-dialog
          v-if="!$vuetify.display.mobile"
          :label="$t('common.logout._')"
          @confirm="logout"
        >
          <template #activator="{ props }">
            <v-btn variant="text" v-bind="props">
              <span v-if="!$vuetify.display.mobile" class="me-2">{{ $t('common.logout._') }}</span>
              <v-icon end icon="$logout" />
            </v-btn>
          </template>
          {{ $t('common.logout.text') }}
        </confirm-dialog>
      </template>
      <template v-else>
        <v-app-bar-title>{{ $t('common._') }}</v-app-bar-title>
      </template>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <navigation
      v-if="showNav && surveyId"
      v-bind="{ surveyId, recall: recallAllowed, feedback: feedbackAllowed }"
    />
    <service-worker />
    <message-box />
    <app-footer :contact="showContact" />
  </v-app>
</template>

<script lang="ts">
import { mapState } from 'pinia';
import { computed, defineComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useLocale } from 'vuetify';

import { useI18n } from '@intake24/i18n';
import { Navigation } from '@intake24/survey/components/layouts';
import { sendGtmEvent } from '@intake24/survey/util';
import { AppFooter, AppNavFooter, ConfirmDialog, Loader, MessageBox, ServiceWorker, useLanguage } from '@intake24/ui';
import { useHttp } from './services';
import { useAuth, useSurvey } from './stores';

export default defineComponent({
  name: 'App',

  components: { AppFooter, AppNavFooter, ConfirmDialog, Loader, MessageBox, Navigation, ServiceWorker },

  setup() {
    const http = useHttp();
    const route = useRoute();
    const router = useRouter();
    const vI18n = useLocale();
    const { i18n: { t } } = useI18n();
    useLanguage('survey', http, vI18n);

    const sidebar = ref(false);

    const title = computed(() => t(route.meta?.title ?? 'common._'));
    const windowInnerHeight = computed(() => window.innerHeight);

    const surveyId = computed<string | undefined>(() => route.params.surveyId?.toString());
    const showContact = computed(() => route.name === 'home');

    function toggleSidebar() {
      sidebar.value = !sidebar.value;
    };

    async function logout() {
      await useAuth().logout(true);
      sendGtmEvent({
        event: 'surveyLogout',
      });
      await router.push(
        surveyId.value ? { name: 'survey-login', params: { surveyId: surveyId.value } } : { name: 'home' },
      );
    };

    watch(title, () => {
      document.title = title.value;
    });

    return {
      logout,
      showContact,
      sidebar,
      surveyId,
      toggleSidebar,
      windowInnerHeight,
    };
  },

  computed: {
    ...mapState(useAuth, ['loggedIn']),
    ...mapState(useSurvey, {
      faqsEnabled: 'faqsEnabled',
      feedbackAllowed: 'feedbackAllowed',
      recallAllowed: 'recallAllowed',
      recallNumber: 'recallNumber',
      surveyName: state => state.parameters?.name,
      userName: state => state.user?.name,
    }),

    showNav(): boolean {
      return this.loggedIn && !!this.surveyId && this.$route.name !== 'survey-recall';
    },
  },
});
</script>

<style lang="scss">
@use '@intake24/survey/scss/app.scss';

.app-bar-survey-info {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow:
    inset 0px 3px 1px -2px rgba(0, 0, 0, 0.2),
    0px 2px 2px 0px rgba(0, 0, 0, 0.14),
    0px 1px 5px 0px rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.87);

  display: flex;
  flex-direction: row;
  align-items: center;

  margin-left: 8px;
  margin-right: 12px;
  padding: 8px 16px 8px 16px;

  overflow: hidden;

  span {
    font-size: 0.9rem;
    letter-spacing: 0.167em;
    text-transform: uppercase;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media screen and (max-width: 600px) {
    flex-direction: column;
    flex-grow: 1;
    align-items: stretch;
    justify-content: space-around;

    padding: 0px 16px 0px 16px;
  }
}

.v-main:has(.bottom-navigation) {
  padding-bottom: 65px !important;
}
</style>
