<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form autocomplete="off" @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.slug"
                :disabled="isEdit"
                :error-messages="errors.get('slug')"
                hide-details="auto"
                :label="$t('surveys.id')"
                name="slug"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('surveys.name')"
                name="name"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <select-resource
                v-model="data.localeId"
                :error-messages="errors.get('localeId')"
                :initial-item="entry.locale"
                item-name="englishName"
                :label="$t('locales._')"
                name="localeId"
                resource="locales"
                @update:model-value="errors.clear('localeId')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <select-resource
                v-model="data.surveySchemeId"
                :error-messages="errors.get('surveySchemeId')"
                :initial-item="entry.surveyScheme"
                :label="$t('survey-schemes._')"
                name="surveySchemeId"
                resource="survey-schemes"
                @update:model-value="errors.clear('surveySchemeId')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <date-picker
                v-model="data.startDate"
                :error-messages="errors.get('startDate')"
                :label="$t('surveys.startDate')"
                @update:model-value="errors.clear('startDate')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <date-picker
                v-model="data.endDate"
                :error-messages="errors.get('endDate')"
                :label="$t('surveys.endDate')"
                @update:model-value="errors.clear('endDate')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.supportEmail"
                autocomplete="off"
                :error-messages="errors.get('supportEmail')"
                hide-details="auto"
                :label="$t('surveys.supportEmail')"
                name="supportEmail"
                prepend-inner-icon="fas fa-envelope"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <select-resource
                v-model="data.faqId"
                clearable
                :error-messages="errors.get('faqId')"
                :initial-item="entry.faq"
                item-name="name"
                :label="$t('faqs._')"
                name="faqId"
                resource="faqs"
                @update:model-value="errors.clear('faqId')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.state"
                :error-messages="errors.get('state')"
                hide-details="auto"
                :items="surveyStates"
                :label="$t('surveys.states._')"
                name="state"
                prepend-inner-icon="fas fa-spinner"
                variant="outlined"
                @update:model-value="errors.clear('state')"
              />
            </v-col>
            <v-col v-show="data.state === 'suspended'" cols="12">
              <v-text-field
                v-model="data.suspensionReason"
                :error-messages="errors.get('suspensionReason')"
                hide-details="auto"
                :label="$t('surveys.suspensionReason')"
                name="suspensionReason"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-divider class="my-6" />
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-h5 mb-4">
                {{ $t('surveys.search._') }}
              </div>
              <v-switch
                v-model="data.searchSettings.collectData"
                class="my-2"
                :error-messages="errors.get('searchSettings.collectData')"
                hide-details="auto"
                :label="$t('surveys.search.collectData')"
                name="searchCollectData"
                @update:model-value="errors.clear('searchSettings.collectData')"
              />
              <v-slider
                v-model.number="data.searchSettings.maxResults"
                :error-messages="errors.get('searchSettings.maxResults')"
                hide-details="auto"
                :label="$t('surveys.search.maxResults')"
                max="100"
                min="10"
                name="seachMaxResults"
                step="1"
                thumb-label="always"
              />
              <div class="text-h6 mb-6 mt-6 underline">
                {{ $t('surveys.search.sorting') }}
              </div>
              <div class="mt-4">
                <v-icon
                  @click="showInformationPopup('sortingAlgorithmInfo')"
                >
                  fas fa-circle-question
                </v-icon>
                <v-label class="ml-2">
                  {{ $t('surveys.search.sortingAlgorithm') }}
                </v-label>
              </div>
              <v-select
                v-model="data.searchSettings.sortingAlgorithm"
                class="mt-2"
                density="compact"
                :error-messages="errors.get('searchSettings.sortingAlgorithm')"
                hide-details="auto"
                :items="searchSortingAlgorithms"
                name="searchSortingAlgorithm"
                prepend-inner-icon="fas fa-arrow-up-wide-short"
                variant="outlined"
                @update:model-value="errors.clear('searchSettings.sortingAlgorithm')"
              />
              <div class="mt-4">
                <v-icon
                  @click="showInformationPopup('matchScoreWeightInfo')"
                >
                  fas fa-circle-question
                </v-icon>
                <v-label class="ml-2">
                  {{ $t('surveys.search.matchScoreWeight') }}
                </v-label>
              </div>
              <v-slider
                v-model.number="data.searchSettings.matchScoreWeight"
                :error-messages="errors.get('searchSettings.matchScoreWeight')"
                hide-details="auto"
                max="100"
                min="0"
                name="searchMatchScoreWeight"
                step="1"
                thumb-label
              >
                <template #prepend>
                  <v-list-subheader>{{ $t('surveys.search.foodOrdering') }}</v-list-subheader>
                </template>
                <template #append>
                  <v-list-subheader>{{ $t('surveys.search.matchQuality') }}</v-list-subheader>
                </template>
              </v-slider>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-h6 mb-10 mt-4 underline">
                <v-icon
                  class="mr-3"
                  @click="showInformationPopup('matchQualityInfo')"
                >
                  fas fa-circle-question
                </v-icon>{{ $t('surveys.search.matchQualityCriteria') }}
              </div>
              <v-slider
                v-model.number="data.searchSettings.firstWordCost"
                class="mt-7"
                :error-messages="errors.get('searchSettings.firstWordCost')"
                hide-details="auto"
                :label="$t('surveys.search.firstWordCost')"
                max="20"
                min="0"
                name="searchFirstWordCost"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model.number="data.searchSettings.wordOrderCost"
                class="mt-7"
                :error-messages="errors.get('searchSettings.wordOrderCost')"
                hide-details="auto"
                :label="$t('surveys.search.wordOrderCost')"
                max="10"
                min="0"
                name="searchWordOrderCost"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model.number="data.searchSettings.wordDistanceCost"
                class="mt-7"
                :error-messages="errors.get('searchSettings.wordDistanceCost')"
                hide-details="auto"
                :label="$t('surveys.search.wordDistanceCost')"
                max="10"
                min="0"
                name="searchWordDistanceCost"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model.number="data.searchSettings.unmatchedWordCost"
                class="mt-7"
                :error-messages="errors.get('searchSettings.unmatchedWordCost')"
                hide-details="auto"
                :label="$t('surveys.search.unmatchedWordCost')"
                max="10"
                min="0"
                name="searchUnmatchedWordCost"
                step="1"
                thumb-label="always"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-h6 mb-4 mt-4 underline">
                <v-icon
                  class="mr-3"
                  @click="showInformationPopup('spellingCorrectionInfo')"
                >
                  fas fa-circle-question
                </v-icon>{{ $t('surveys.search.spellingCorrection') }}
              </div>
              <v-switch
                v-model="data.searchSettings.enableEditDistance"
                class="mt-6"
                :error-messages="errors.get('searchSettings.enableEditDistance')"
                hide-details="auto"
                :label="$t('surveys.search.enableEditDistance')"
                name="searchEnableEditDistance"
                @update:model-value="errors.clear('searchSettings.enableEditDistance')"
              />
              <v-slider
                v-model.number="data.searchSettings.minWordLength1"
                class="mt-6"
                :error-messages="errors.get('searchSettings.minWordLength1')"
                hide-details="auto"
                :label="$t('surveys.search.minWordLength1')"
                max="10"
                min="2"
                name="searchMinWordLength1"
                step="1"
                thumb-label="always"
              />
              <v-slider
                v-model.number="data.searchSettings.minWordLength2"
                class="mt-6"
                :error-messages="errors.get('searchSettings.minWordLength2')"
                hide-details="auto"
                :label="$t('surveys.search.minWordLength2')"
                max="10"
                min="3"
                name="searchMinWordLength2"
                step="1"
                thumb-label="always"
              />
              <v-switch
                v-model="data.searchSettings.enablePhonetic"
                class="my-2"
                :error-messages="errors.get('searchSettings.enablePhonetic')"
                hide-details="auto"
                :label="$t('surveys.search.enablePhonetic')"
                name="searchEnablePhonetic"
                @update:model-value="errors.clear('searchSettings.enablePhonetic')"
              />
              <v-slider
                v-model.number="data.searchSettings.minWordLengthPhonetic"
                class="mt-0 mb-6"
                :error-messages="errors.get('searchSettings.minWordLengthPhonetic')"
                hide-details="auto"
                :label="$t('surveys.search.minWordLengthPhonetic')"
                max="10"
                min="2"
                name="searchMinWordLengthPhonetic"
                step="1"
                thumb-label="always"
              />
              <v-label>
                {{ $t('surveys.search.spellingCorrectionPreference') }}
              </v-label>
              <v-select
                v-model="data.searchSettings.spellingCorrectionPreference"
                class="mt-2"
                density="compact"
                :error-messages="errors.get('searchSettings.spellingCorrectionPreference')"
                hide-details="auto"
                :items="spellingCorrectionOptions"
                name="searchSpellingCorrectionPreference"
                prepend-inner-icon="fas fa-arrow-up-wide-short"
                variant="outlined"
                @update:model-value="errors.clear('searchSettings.spellingCorrectionPreference')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-h6 mb-4 mt-4 underline">
                <v-icon
                  class="mr-3"
                  @click="showInformationPopup('relevantCategoriesInfo')"
                >
                  fas fa-circle-question
                </v-icon>{{ $t('surveys.search.relevantCategories') }}
              </div>
              <v-switch
                v-model="data.searchSettings.enableRelevantCategories"
                class="mt-6"
                :error-messages="errors.get('searchSettings.enableRelevantCategories')"
                hide-details="auto"
                :label="$t('surveys.search.enableRelevantCategories')"
                name="searchEnableRelevantCategories"
                @update:model-value="errors.clear('searchSettings.enableRelevantCategories')"
              />
              <v-slider
                v-model.number="data.searchSettings.relevantCategoryDepth"
                class="mt-8"
                :error-messages="errors.get('searchSettings.relevantCategoryDepth')"
                hide-details="auto"
                :label="$t('surveys.search.relevantCategoryDepth')"
                max="5"
                min="0"
                name="searchRelevantCategoryDepth"
                step="1"
                thumb-label="always"
              />
              <information-popup v-if="infoComponentType" :component-type="`${infoComponentType}`" :open="infoPopupOpen" :title="$t(`surveys.search.information.${infoComponentType}.title`)" @close="hideInformationPopup" />
            </v-col>
            <v-col :cols="$vuetify.display.mdAndUp ? `auto` : '12'">
              <v-divider :vertical="$vuetify.display.mdAndUp" />
            </v-col>
          </v-row>
          <v-divider class="my-6" />
          <v-row>
            <v-col cols="12" md>
              <div class="text-h5 mb-4">
                {{ $t('surveys.auth._') }}
              </div>
              <v-select
                v-model="data.authModes"
                :error-messages="errors.get('authModes')"
                hide-details="auto"
                :items="authModes"
                :label="$t('surveys.auth.modes._')"
                multiple
                name="authModes"
                prepend-inner-icon="fas fa-mask"
                variant="outlined"
                @update:model-value="errors.clear('authModes')"
              />
              <v-switch
                v-model="data.authCaptcha"
                class="my-2"
                :error-messages="errors.get('authCaptcha')"
                hide-details="auto"
                :label="$t('surveys.auth.captcha')"
                name="authCaptcha"
                @update:model-value="errors.clear('authCaptcha')"
              />
              <v-text-field
                v-model="data.authUrlTokenCharset"
                class="mb-4"
                :error-messages="errors.get('authUrlTokenCharset')"
                hide-details="auto"
                :label="$t('surveys.auth.urlTokenCharset')"
                name="authUrlTokenCharset"
                prepend-inner-icon="fas fa-font"
                variant="outlined"
              />
              <v-text-field
                v-model.number="data.authUrlTokenLength"
                class="mb-4"
                :error-messages="errors.get('authUrlTokenLength')"
                hide-details="auto"
                :label="$t('surveys.auth.urlTokenLength')"
                name="authUrlTokenLength"
                prepend-inner-icon="fas fa-ruler-horizontal"
                variant="outlined"
              />
              <v-text-field
                v-model="data.authUrlDomainOverride"
                :error-messages="errors.get('authUrlDomainOverride')"
                hide-details="auto"
                :label="$t('surveys.auth.urlDomainOverride')"
                name="authUrlDomainOverride"
                prepend-inner-icon="fas fa-up-right-from-square"
                variant="outlined"
              />
            </v-col>
            <v-col :cols="$vuetify.display.mdAndUp ? `auto` : '12'">
              <v-divider :vertical="$vuetify.display.mdAndUp" />
            </v-col>
            <v-col cols="12" md>
              <div class="text-h5 mb-4">
                {{ $t('surveys.submissionLimits._') }}
              </div>
              <v-text-field
                v-model.number="data.maximumDailySubmissions"
                class="mb-4"
                :error-messages="errors.get('maximumDailySubmissions')"
                hide-details="auto"
                :label="$t('surveys.submissionLimits.maxDaily')"
                name="maximumDailySubmissions"
                variant="outlined"
              />
              <v-text-field
                v-model.number="data.maximumTotalSubmissions"
                class="mb-4"
                :error-messages="errors.get('maximumTotalSubmissions')"
                hide-details="auto"
                :label="$t('surveys.submissionLimits.maxTotal')"
                name="maximumTotalSubmissions"
                variant="outlined"
              />
              <v-text-field
                v-model.number="data.minimumSubmissionInterval"
                :error-messages="errors.get('minimumSubmissionInterval')"
                hide-details="auto"
                :label="$t('surveys.submissionLimits.minInterval')"
                name="minimumSubmissionInterval"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-divider class="my-6" />
          <v-row>
            <v-col cols="12" md>
              <div class="text-h5">
                {{ $t('surveys.externalComm._') }}
              </div>
              <v-switch
                v-model="data.allowGenUsers"
                class="my-2"
                :error-messages="errors.get('allowGenUsers')"
                hide-details="auto"
                :label="$t('surveys.externalComm.allowGenUsers')"
                name="allowGenUsers"
                @update:model-value="errors.clear('allowGenUsers')"
              />
              <v-text-field
                v-model="data.genUserKey"
                autocomplete="new-password"
                class="mb-4"
                :error-messages="errors.get('genUserKey')"
                hide-details="auto"
                :label="$t('surveys.externalComm.secret._')"
                name="genUserKey"
                :type="showSecret ? 'text' : 'password'"
                variant="outlined"
              >
                <template #append-inner>
                  <v-icon class="me-2" @click="showSecret = !showSecret">
                    {{ showSecret ? 'fas fa-eye' : 'fas fa-eye-slash' }}
                  </v-icon>
                </template>
                <template #append>
                  <confirm-dialog :label="$t('surveys.externalComm.secret.generate._')" @confirm="generateSecret">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        color="primary"
                        icon="fas fa-rotate"
                        :label="$t('surveys.externalComm.secret.generate._')"
                        variant="flat"
                      />
                    </template>
                    {{ $t('surveys.externalComm.secret.generate.text') }}
                  </confirm-dialog>
                </template>
              </v-text-field>
              <event-notifications
                v-model="data.notifications"
                :error-messages="errors.get('notifications')"
                name="notifications"
                @update:model-value="errors.clear('notifications')"
              />
            </v-col>
            <v-col :cols="$vuetify.display.mdAndUp ? `auto` : '12'">
              <v-divider :vertical="$vuetify.display.mdAndUp" />
            </v-col>
            <v-col cols="12" md>
              <div class="text-h5 mb-4">
                {{ $t('surveys.session._') }}
              </div>
              <v-switch
                v-model="data.session.store"
                class="my-2"
                :error-messages="errors.get('session.store')"
                hide-details="auto"
                :label="$t('surveys.session.store')"
                name="session.store"
                @update:model-value="errors.clear('session.store')"
              />
              <v-text-field
                v-model="data.session.age"
                class="mb-4"
                :error-messages="errors.get('session.age')"
                hide-details="auto"
                :hint="$t('surveys.session.age.hint')"
                :label="$t('surveys.session.age._')"
                name="session.age"
                prepend-inner-icon="fas fa-stopwatch"
                variant="outlined"
              />
              <v-text-field
                v-model="data.session.fixed"
                :error-messages="errors.get('session.fixed')"
                hide-details="auto"
                :hint="$t('surveys.session.fixed.hint')"
                :label="$t('surveys.session.fixed._')"
                name="session.fixed"
                prepend-inner-icon="fas fa-stopwatch"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-divider class="my-6" />
          <v-row>
            <v-col cols="12" md>
              <div class="text-h5 mb-4">
                {{ $t('surveys.users._') }}
              </div>
              <v-switch
                v-model="data.userPersonalIdentifiers"
                :error-messages="errors.get('userPersonalIdentifiers')"
                hide-details="auto"
                :label="$t('surveys.users.personalIdentifiers')"
                name="userPersonalIdentifiers"
                @update:model-value="errors.clear('userPersonalIdentifiers')"
              />
              <v-switch
                v-model="data.userCustomFields"
                :error-messages="errors.get('userCustomFields')"
                hide-details="auto"
                :label="$t('surveys.users.customFields')"
                name="userCustomFields"
                @update:model-value="errors.clear('userCustomFields')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-h5 mb-4">
                {{ $t('surveys.feedback._') }}
              </div>
              <select-resource
                v-model="data.feedbackSchemeId"
                class="mb-4"
                clearable
                :error-messages="errors.get('feedbackSchemeId')"
                :initial-item="entry.feedbackScheme"
                :label="$t('feedback-schemes._')"
                name="feedbackSchemeId"
                resource="feedback-schemes"
                @update:model-value="errors.clear('feedbackSchemeId')"
              />
              <v-text-field
                v-model.number="data.numberOfSubmissionsForFeedback"
                :disabled="!data.feedbackSchemeId"
                :error-messages="errors.get('numberOfSubmissionsForFeedback')"
                hide-details="auto"
                :label="$t('surveys.feedback.numberOfSubmissions')"
                name="numberOfSubmissionsForFeedback"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { SchemeOverrides, SessionSettings, SurveyAuthMode, SurveySearchSettings, SurveyStatus } from '@intake24/common/surveys';
import type { Notification } from '@intake24/common/types';
import type { SurveyEntry } from '@intake24/common/types/http/admin';

import { defineComponent, ref } from 'vue';

import { EventNotifications, SelectResource } from '@intake24/admin/components/dialogs';
import InformationPopup from '@intake24/admin/components/dialogs/information-popup.vue';
import { formMixin } from '@intake24/admin/components/entry';
import { DatePicker } from '@intake24/admin/components/forms';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import {
  defaultOverrides,
  defaultSearchSettings,
  searchSortingAlgorithms as defaultSearchSortingAlgorithms,
  defaultSessionSettings,
  spellingCorrectionPreferences as defaultSpellingCorrectionPreferences,
  surveyAuthModes,
  surveyStatuses,
} from '@intake24/common/surveys';
import { randomString } from '@intake24/common/util';
import { ConfirmDialog, useI18n } from '@intake24/ui';

export type SurveyForm = {
  id: string | null;
  slug: string | null;
  name: string | null;
  state: SurveyStatus;
  localeId: string | null;
  surveySchemeId: string | null;
  faqId: string | null;
  feedbackSchemeId: string | null;
  startDate: string | null;
  endDate: string | null;
  supportEmail: string | null;
  suspensionReason: string | null;
  session: SessionSettings;
  numberOfSubmissionsForFeedback: number;
  notifications: Notification[];
  /*
  surveyMonkeyUrl: string | null;
  originatingUrl: string | null;
   */
  allowGenUsers: boolean;
  genUserKey: string | null;
  authCaptcha: boolean;
  authModes: SurveyAuthMode[];
  authUrlDomainOverride: string | null;
  authUrlTokenCharset: string | null;
  authUrlTokenLength: number | null;
  maximumDailySubmissions: number;
  maximumTotalSubmissions: number | null;
  minimumSubmissionInterval: number;
  searchSettings: SurveySearchSettings;
  surveySchemeOverrides: SchemeOverrides;
  userPersonalIdentifiers: boolean;
  userCustomFields: boolean;
};

export const surveyForm: SurveyForm = {
  id: null,
  slug: null,
  name: null,
  state: 'notStarted',
  localeId: null,
  surveySchemeId: null,
  faqId: null,
  feedbackSchemeId: null,
  startDate: null,
  endDate: null,
  supportEmail: null,
  suspensionReason: null,
  session: defaultSessionSettings,
  numberOfSubmissionsForFeedback: 1,
  notifications: [],
  /* surveyMonkeyUrl: null,
  originatingUrl: null, */
  allowGenUsers: false,
  genUserKey: null,
  authCaptcha: false,
  authModes: ['token'],
  authUrlDomainOverride: null,
  authUrlTokenCharset: null,
  authUrlTokenLength: null,
  maximumDailySubmissions: 3,
  maximumTotalSubmissions: null,
  minimumSubmissionInterval: 600,
  searchSettings: defaultSearchSettings,
  surveySchemeOverrides: defaultOverrides,
  userPersonalIdentifiers: false,
  userCustomFields: false,
};

export default defineComponent({
  name: 'SurveyForm',

  components: { ConfirmDialog, InformationPopup, DatePicker, EventNotifications, SelectResource },

  mixins: [formMixin],

  setup(props) {
    const { i18n: { t } } = useI18n();
    const { entry, entryLoaded, isEdit } = useEntry<SurveyEntry>(props);

    const infoComponentType = ref(undefined as string | undefined);
    const infoPopupOpen = ref(false);
    const showSecret = ref(false);

    const authModes = surveyAuthModes.map(value => ({
      value,
      title: t(`surveys.auth.modes.${value}`),
    }));

    const surveyStates = surveyStatuses.map(value => ({
      value,
      title: t(`surveys.states.${value}`),
    }));
    const searchSortingAlgorithms = defaultSearchSortingAlgorithms.map(value => ({
      value,
      title: t(`surveys.search.algorithms.${value}`),
    }));
    const spellingCorrectionOptions = defaultSpellingCorrectionPreferences.map(value => ({
      value,
      title: t(`surveys.search.spellingCorrectionOptions.${value}`),
    }));

    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<SurveyForm, SurveyEntry>(props, {
      data: surveyForm,
      editMethod: 'patch',
    });

    const showInformationPopup = (type: string) => {
      infoComponentType.value = `${type}`;
      infoPopupOpen.value = true;
    };

    const hideInformationPopup = () => {
      infoPopupOpen.value = false;
    };

    const generateSecret = () => {
      data.value.genUserKey = randomString(64);
    };

    return {
      entry,
      entryLoaded,
      isEdit,
      clearError,
      data,
      errors,
      generateSecret,
      routeLeave,
      hideInformationPopup,
      infoComponentType,
      infoPopupOpen,
      searchSortingAlgorithms,
      showSecret,
      showInformationPopup,
      spellingCorrectionOptions,
      submit,
      authModes,
      surveyStates,
    };
  },

  watch: {
    'form.allowGenUsers': {
      handler(val) {
        if (!val)
          this.showSecret = false;
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.underline {
  border-bottom: 1px solid lightgray;
}
</style>
