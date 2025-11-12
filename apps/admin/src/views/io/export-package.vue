<template>
  <v-container class="file-export-container">
    <v-row ref="activeJobsRef">
      <v-col>
        <h3>{{ $t('io.export.pageTitle') }}</h3>
      </v-col>
    </v-row>

    <v-row v-if="jobs.length > 0">
      <v-col>
        <v-card
          density="comfortable"
        >
          <v-card-title>
            {{ $t('io.export.activeJobs._') }}
          </v-card-title>
          <v-card-text class="mt-4">
            <v-alert
              v-if="jobs.length === 0"
              :title="$t('io.export.noActiveJobs')"
              type="info"
              variant="tonal"
            />
            <v-table v-if="jobs.length > 0" class="job-status-table " density="comfortable" striped="even">
              <thead>
                <tr>
                  <th class="text-left job-id-col">
                    {{ $t('io.export.activeJobs.jobId') }}
                  </th>
                  <th class="text-left started-at-col">
                    {{ $t('io.export.activeJobs.startedAt') }}
                  </th>
                  <th class="text-left status-col">
                    {{ $t('io.export.activeJobs.status._') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in jobs" :key="job.id">
                  <td>{{ job.id }}</td>
                  <td>{{ job.startedAt === null ? "N/A" : formatDate(job.startedAt.toString()) }}</td>
                  <td>
                    <v-alert
                      v-if="job.successful === true && downloadUrlAvailable(job)"
                      density="compact"
                      icon-size="small"
                      :title="$t('io.export.activeJobs.status.success')"
                      type="success"
                      variant="text"
                    >
                      <span class="text-black">
                        {{ $t('io.export.downloadAvailable') }}
                        <v-btn
                          size="small"
                          variant="text"
                          @click="download(job)"
                        >
                          <v-icon>fa fa-download</v-icon>
                          {{ $t('common.action.download') }}
                        </v-btn>
                      </span>
                    </v-alert>
                    <v-alert
                      v-else-if="job.successful === true && !job.downloadUrl"
                      color="#777777"
                      density="compact"
                      icon="$success"
                      icon-size="small"
                      :title="$t('io.export.activeJobs.status.success')"
                      type="warning"
                      variant="text"
                    >
                      {{ $t('io.export.downloadExpired') }}
                    </v-alert>

                    <v-alert
                      v-else-if="job.successful === false"
                      density="compact"
                      icon-size="small"
                      :title="$t('io.export.activeJobs.status.error')"
                      type="error"
                      variant="text"
                    >
                      {{ job.message }}
                    </v-alert>
                    <div v-else-if="job.successful === null" class="d-flex align-center">
                      <v-progress-linear
                        color="green"
                        height="24"
                        :indeterminate="job.progress === null"
                        max="1"
                        min="0"
                        :model-value="job.progress ?? 0"
                        rounded
                      >
                        <span>
                          {{ $t('io.export.activeJobs.status.inProgress') }}: {{ ((job.progress ?? 0) * 100).toFixed(1) }}%
                        </span>
                      </v-progress-linear>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            {{ $t('io.export.requestExport') }}
          </v-card-title>
          <v-card-text class="mt-4">
            <v-row>
              <v-col cols="12">
                <v-radio-group
                  v-model="exportFormat"
                  hide-details
                  :label="$t('io.export.format._')"
                >
                  <v-radio :label="$t('io.export.format.default')" value="json" />
                  <v-radio :label="$t('io.export.format.xlsx')" value="xlsx" />
                </v-radio-group>
              </v-col>
            </v-row>
            <v-row class="pl-4">
              <v-col cols="12">
                <select-resource-multiple
                  v-model="exportLocales"
                  clearable
                  :error-messages="errors.get('localeId')"
                  item-name="englishName"
                  :label="$t('io.export.locales')"
                  name="localeId"
                  resource="locales"
                  @update:model-value="errors.clear('localeId')"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-label class="ml-4">
                  {{ $t('io.export.includeOptions._') }}
                </v-label>
              </v-col>
            </v-row>
            <v-row class="pl-2 pr-4 mt-0">
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="includeFlags.foods"
                  hide-details
                  :label="$t('io.export.includeOptions.foods')"
                />
                <v-checkbox
                  v-model="includeFlags.categories"
                  hide-details
                  :label="$t('io.export.includeOptions.categories')"
                />
                <v-checkbox
                  v-model="includeFlags.portionSizeMethods"
                  hide-details
                  :label="$t('io.export.includeOptions.portionSizeMethods')"
                />
                <v-checkbox
                  v-model="includeFlags.associatedFoodPrompts"
                  hide-details
                  :label="$t('io.export.includeOptions.associatedFoodPrompts')"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="includeFlags.asServedImages"
                  hide-details
                  :label="$t('io.export.includeOptions.asServedImages')"
                />
                <v-checkbox
                  v-model="includeFlags.guideImages"
                  hide-details
                  :label="$t('io.export.includeOptions.guideImages')"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col>
                <v-btn
                  block
                  color="primary"
                  :disabled="exportLocales.length === 0"
                  size="large"
                  @click="startExport"
                >
                  {{ $t('io.export.exportButtonLabel') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useTemplateRef, watch } from 'vue';
import { useDownloadJob, usePollsForJobs } from '@intake24/admin/components/jobs';
import { useErrors } from '@intake24/admin/composables';
import type { Dictionary } from '@intake24/common/types';
import SelectResourceMultiple from '../../components/dialogs/select-resource-multiple.vue';
import { httpService } from '../../services';

type ExportFormat = 'json' | 'xlsx';

const errors = useErrors();
const { jobs, startPolling } = usePollsForJobs('PackageExport');
const { download, downloadUrlAvailable } = useDownloadJob(true);

const browserLocale = navigator.languages?.[0] ?? navigator.language ?? 'en-GB';

const dateTimeFormat = new Intl.DateTimeFormat(browserLocale, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const timeFormat = new Intl.DateTimeFormat(browserLocale, {
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(datestamp: string) {
  const date = new Date(datestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateDay.getTime() === today.getTime())
    return `Today at ${timeFormat.format(date)}`;
  if (dateDay.getTime() === yesterday.getTime())
    return `Yesterday at ${timeFormat.format(date)}`;

  return dateTimeFormat.format(date);
}

const activeJobsRef = useTemplateRef('activeJobsRef');

function scrollToActiveJobs() {
  if (activeJobsRef.value !== null)
    activeJobsRef.value.$el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
}

const exportFormat = ref<ExportFormat>('json');
const exportLocales = ref<Dictionary[]>([]);
const exportJobId = ref<string | null>(null);
const exportErrorMessage = ref<string | null>(null);

const includeFlags = reactive({
  foods: true,
  categories: true,
  portionSizeMethods: true,
  associatedFoodPrompts: true,
  asServedImages: true,
  guideImages: true,
});

const includeOptions = computed(() => {
  const options: string[] = [];

  if (includeFlags.foods)
    options.push('foods');
  if (includeFlags.categories)
    options.push('categories');

  return options;
});

watch(exportLocales, () => errors.clear('localeId'));

watch(exportJobId, (newId) => {
  if (newId) {
    scrollToActiveJobs();
    exportLocales.value = [];
  }
});

async function startExport() {
  if (exportLocales.value.length === 0)
    return;

  try {
    const response = await httpService.post('/admin/package-export', {
      format: exportFormat.value,
      locales: exportLocales.value.map(i => i.code),
      options: { include: includeOptions.value },
    });

    exportJobId.value = response.data.jobId;
    exportErrorMessage.value = null;
    startPolling(true);
  }
  catch (error: any) {
    handleExportError(error);
  }
}

startPolling(true);

function handleExportError(error: any) {
  exportErrorMessage.value = error.response?.data?.message || error.message || 'An unexpected error occurred during export';
}
</script>

<style scoped>
.job-status-table {
  width: 100%;
}

.job-id-col {
  width: 10%;
}
.started-at-col {
  width: 10%;
}
.action-col {
  width: 10%;
}
.status-col {
  width: auto;
}
</style>
