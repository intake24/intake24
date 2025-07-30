<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('surveys.id') }}</th>
          <td>{{ entry.slug }}</td>
          <th>{{ $t('surveys.name') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('locales._') }}</th>
          <td>{{ entry.locale.englishName }}</td>
          <th>{{ $t('survey-schemes._') }}</th>
          <td>{{ entry.surveyScheme.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.startDate') }}</th>
          <td>{{ formatDate(entry.startDate) }}</td>
          <th>{{ $t('surveys.endDate') }}</th>
          <td>{{ formatDate(entry.endDate) }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.supportEmail') }}</th>
          <td>{{ entry.supportEmail }}</td>
          <th>{{ $t('surveys.states._') }}</th>
          <td>{{ $t(`surveys.states.${entry.state}`) }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.externalComm.allowGenUsers') }}</th>
          <td>{{ $t(`common.${entry.allowGenUsers}`) }}</td>
          <th>{{ $t('surveys.externalComm.secret._') }}</th>
          <td>
            <v-text-field
              autocomplete="new-password"
              hide-details="auto"
              :model-value="entry.genUserKey"
              name="genUserKey"
              readonly
              :type="showSecret ? 'text' : 'password'"
              variant="plain"
            >
              <template #append-inner>
                <v-icon class="me-2" @click="showSecret = !showSecret">
                  {{ showSecret ? 'fas fa-eye' : 'fas fa-eye-slash' }}
                </v-icon>
              </template>
            </v-text-field>
          </td>
        </tr>
        <tr>
          <th>{{ $t('surveys.users.personalIdentifiers') }}</th>
          <td>{{ $t(`common.${entry.userPersonalIdentifiers}`) }}</td>
          <th>{{ $t('surveys.users.customFields') }}</th>
          <td>{{ $t(`common.${entry.userCustomFields}`) }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.session.age._') }}</th>
          <td>{{ entry.session.age }}</td>
          <th>{{ $t('surveys.session.fixed._') }}</th>
          <td>{{ entry.session.fixed }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.session.store') }}</th>
          <td colspan="3">
            {{ $t(`common.${entry.session.store}`) }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('surveys.submissionLimits.maxDaily') }}</th>
          <td>{{ entry.maximumDailySubmissions }}</td>
          <th>{{ $t('surveys.submissionLimits.maxTotal') }}</th>
          <td>{{ entry.maximumTotalSubmissions }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.submissionLimits.minInterval') }}</th>
          <td colspan="3">
            {{ entry.minimumSubmissionInterval }}
          </td>
        </tr>
        <tr v-if="entry.feedbackScheme">
          <th>{{ $t('feedback-schemes._') }}</th>
          <td>{{ entry.feedbackScheme.name }}</td>
          <th>{{ $t('surveys.feedback.numberOfSubmissions') }}</th>
          <td>{{ entry.numberOfSubmissionsForFeedback }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.auth.captcha') }}</th>
          <td>{{ $t(`common.${entry.authCaptcha}`) }}</td>
          <th>{{ $t('surveys.auth.urlDomainOverride') }}</th>
          <td>{{ entry.authUrlDomainOverride }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.auth.urlTokenCharset') }}</th>
          <td>{{ entry.authUrlTokenCharset }}</td>
          <th>{{ $t('surveys.auth.urlTokenLength') }}</th>
          <td>{{ entry.authUrlTokenLength }}</td>
        </tr>
        <tr>
          <th>{{ $t('surveys.search.sortingAlgorithm') }}</th>
          <td>{{ $t(`surveys.search.algorithms.${entry.searchSettings.sortingAlgorithm}`) }}</td>
          <th>{{ $t('surveys.search.matchScoreWeight') }}</th>
          <td>{{ entry.searchSettings.matchScoreWeight }}</td>
        </tr>
        <tr v-if="entry.faq">
          <th>{{ $t('faqs._') }}</th>
          <td colspan="3">
            {{ entry.faq.name }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useDateTime, useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { SurveyEntry } from '@intake24/common/types/http/admin';

export default defineComponent({
  name: 'SurveyDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { formatDate } = useDateTime();
    const { entry, entryLoaded } = useEntry<SurveyEntry>(props);

    const showSecret = ref(false);

    return {
      entry,
      entryLoaded,
      formatDate,
      showSecret,
    };
  },
});
</script>

<style lang="scss" scoped></style>
