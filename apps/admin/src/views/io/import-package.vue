<template>
  <v-container>
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
      <div>
        <h2 class="text-headline-small">
          {{ t('io.import._') }}
        </h2>
        <div class="text-body-medium text-medium-emphasis">
          {{ t('io.import.subtitle') }}
        </div>
      </div>
      <v-btn
        :href="formatHelpUrl"
        prepend-icon="$docs"
        rel="noopener noreferrer"
        size="small"
        target="_blank"
        variant="text"
      >
        {{ t('io.import.formatHelp') }}
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12" lg="4" md="5">
        <v-card border class="status-panel" flat rounded>
          <div class="pa-6 d-flex flex-column gr-6">
            <v-select
              v-model="packageFormat"
              :disabled="formatLocked"
              :items="formats"
              :label="t('io.import.package.format')"
            />

            <div
              class="dropzone d-flex flex-column align-center text-center px-4 py-5"
              :class="{
                'dropzone--selected': hasFile,
                'dropzone--dragover': dragActive,
                'dropzone--disabled': replaceBlocked,
              }"
              @dragenter.prevent="onDragEnter"
              @dragleave="onDragLeave"
              @dragover.prevent="onDragOver"
              @drop.prevent="onDrop"
            >
              <v-icon
                :class="{ 'text-disabled': replaceBlocked }"
                :color="replaceBlocked ? undefined : hasFile ? 'success' : 'primary'"
                icon="fas fa-cloud-arrow-up"
                size="28"
              />
              <div class="text-body-medium font-weight-bold mt-3">
                {{ t('io.import.package.dropHere') }}
              </div>
              <div class="dropzone-hint text-body-medium text-medium-emphasis text-truncate mt-2">
                {{ dropzoneHint }}
              </div>
              <v-btn class="mt-4" :disabled="replaceBlocked" variant="outlined" @click="fileInput?.click()">
                {{ t('io.import.package.choose') }}
              </v-btn>
              <input
                ref="fileInput"
                :accept="zipAccept"
                class="d-none"
                type="file"
                @change="onFileInputChange"
              >
            </div>

            <div>
              <!-- Deliberately uses the stepper's step title style -->
              <div class="step-title font-weight-bold mb-2">
                {{ t('io.import.package.selectedFile') }}
              </div>
              <v-list-item class="px-0">
                <template #prepend>
                  <v-avatar
                    :color="file ? 'primary' : 'grey-lighten-4'"
                    size="40"
                    :variant="file ? 'tonal' : 'flat'"
                  >
                    <v-icon
                      :class="{ 'text-medium-emphasis': !file }"
                      :icon="file ? 'fas fa-file-zipper' : 'fas fa-file'"
                      size="18"
                    />
                  </v-avatar>
                </template>
                <v-list-item-title
                  :class="file ? 'text-body-large font-weight-bold' : 'text-medium-emphasis'"
                  :title="file?.name"
                >
                  {{ file ? file.name : t('io.import.package.noFile') }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ file ? formatSize(file.size) : t('io.import.package.limit') }}
                </v-list-item-subtitle>
              </v-list-item>

              <v-btn
                block
                class="mt-4"
                color="primary"
                :disabled="stage !== 'file-selected' || !canUpload"
                rounded
                @click="uploadAndValidate"
              >
                <v-icon icon="$upload" start />
                {{ t('io.import.package.uploadAndValidate') }}
              </v-btn>
            </div>
          </div>

          <v-divider />

          <div class="stepper pa-6">
            <div
              v-for="(step, i) in steps"
              :key="step.key"
              class="step"
              :class="`step--${step.emphasis}`"
            >
              <div class="step-rail">
                <div class="step-number">
                  {{ i + 1 }}
                </div>
                <div
                  v-if="i < steps.length - 1"
                  class="step-connector d-none d-md-block"
                  :class="{ 'step-connector--done': step.state === 'done' }"
                />
              </div>

              <div class="step-avatar d-none d-md-flex">
                <v-progress-circular
                  v-if="step.state === 'active'"
                  class="step-spinner"
                  color="primary"
                  indeterminate
                  size="56"
                  width="2"
                />
                <v-badge
                  bordered
                  :color="step.state === 'failed' ? 'error' : 'success'"
                  :icon="step.state === 'failed' ? 'fas fa-xmark' : 'fas fa-check'"
                  location="bottom end"
                  :model-value="step.state === 'done' || step.state === 'failed'"
                >
                  <v-avatar color="grey-lighten-4" size="48">
                    <v-icon
                      :class="{ 'text-medium-emphasis': step.emphasis !== 'current' }"
                      :color="step.emphasis === 'current' ? 'primary' : undefined"
                      :icon="step.icon"
                      size="20"
                    />
                  </v-avatar>
                </v-badge>
              </div>

              <div class="step-text min-width-0">
                <div class="step-title text-truncate">
                  {{ step.title }}
                </div>
                <div class="text-body-medium text-medium-emphasis text-truncate d-none d-md-block">
                  {{ step.detail }}
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" md="7">
        <v-card border class="pa-5" flat rounded>
          <template v-if="stage === 'select' || stage === 'file-selected'">
            <v-alert
              v-if="!canUpload"
              class="mb-4"
              icon="fas fa-lock"
              :text="t('io.import.notice.noUploadPermission')"
              type="warning"
              variant="tonal"
            />
            <v-alert
              v-if="notice"
              class="mb-4"
              closable
              :text="t(notice.key, notice.params ?? {})"
              :type="notice.type"
              variant="tonal"
              @click:close="notice = null"
            />
            <div class="empty-main d-flex flex-column align-center justify-center text-center pa-8">
              <v-avatar class="mb-4" color="grey-lighten-4" size="56">
                <v-icon class="text-medium-emphasis" icon="$upload" />
              </v-avatar>
              <div class="text-body-large text-medium-emphasis mb-1">
                {{ t('io.import.empty.title') }}
              </div>
              <div class="text-body-medium text-medium-emphasis">
                {{ t('io.import.empty.subtitle') }}
              </div>
            </div>
          </template>

          <template v-else-if="progressPanel">
            <h3 class="text-title-large px-4 pt-0 pb-4">
              {{ progressPanel.heading }}
            </h3>
            <v-list-item lines="two">
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon :icon="progressPanel.icon" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ progressPanel.title }}</v-list-item-title>
              <v-list-item-subtitle v-if="progressPanel.subtitle">
                {{ progressPanel.subtitle }}
              </v-list-item-subtitle>
            </v-list-item>
            <div class="px-4 pt-3 pb-3">
              <v-progress-linear
                color="primary"
                height="8"
                :indeterminate="progressPanel.value === null"
                :model-value="progressPanel.value ?? 0"
                rounded
              />
            </div>
            <div v-if="progressPanel.cancel" class="d-flex justify-center pt-5 pb-3">
              <v-btn color="error" rounded variant="outlined" @click="progressPanel.cancel.action">
                {{ progressPanel.cancel.label }}
              </v-btn>
            </div>
          </template>

          <template v-else-if="stage === 'verify-failed'">
            <h3 class="text-title-large px-4 pt-0 pb-4">
              {{ t('io.import.progress.validation.heading') }}
            </h3>
            <div class="px-4 pb-3">
              <v-alert class="mb-5" icon="fas fa-triangle-exclamation" type="error">
                <div class="font-weight-medium">
                  {{ t('io.import.validation.failedTitle') }}
                </div>
                <div class="text-body-medium">
                  {{ t('io.import.validation.failedHint') }}
                </div>
              </v-alert>

              <template v-if="problems">
                <div class="d-flex align-center justify-space-between flex-wrap ga-2 pb-3">
                  <h4 class="panel-subheader">
                    {{ t('io.import.validation.filesWithProblems') }}
                  </h4>
                  <v-btn prepend-icon="fas fa-copy" size="small" variant="text" @click="copyProblems">
                    {{ t('io.import.validation.copy') }}
                  </v-btn>
                </div>

                <v-card border class="problems" flat rounded>
                  <v-list class="problems-files" density="compact" nav>
                    <v-list-item
                      v-for="group in problems"
                      :key="group.file"
                      :active="group.file === selectedProblemFile"
                      color="error"
                      rounded
                      @click="selectedProblemFile = group.file"
                    >
                      <v-list-item-title class="text-body-medium">
                        {{ fileLabel(group.file) }}
                      </v-list-item-title>
                      <template #append>
                        <v-chip color="error" label size="x-small" variant="flat">
                          {{ group.messages.length }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>

                  <!-- A package can report thousands of problems, so the list is virtualised.
                       Keyed by file so that switching files scrolls back to the top. -->
                  <v-virtual-scroll
                    :key="selectedProblemFile ?? ''"
                    class="problems-messages"
                    item-height="40"
                    :items="currentProblems"
                    max-height="360"
                  >
                    <template #default="{ item }">
                      <div class="d-flex ga-3 px-4 py-2">
                        <v-icon class="mt-1" color="error" icon="fas fa-circle-exclamation" size="14" />
                        <div class="error-text text-body-medium min-width-0">
                          {{ t(item.key, item.params ?? {}) }}
                        </div>
                      </div>
                    </template>
                  </v-virtual-scroll>
                </v-card>
              </template>

              <!-- The job failed without localisable error details: show its message -->
              <template v-else>
                <h4 class="panel-subheader pb-3">
                  {{ t('io.import.validation.details') }}
                </h4>
                <v-card border flat rounded>
                  <div class="error-row d-flex ga-3 px-4 py-2">
                    <v-icon class="mt-1" color="error" icon="fas fa-circle-exclamation" size="14" />
                    <div class="error-text text-body-medium min-width-0">
                      {{ validationMessage ?? t('io.import.validation.unexpected', { message: '' }) }}
                    </div>
                  </div>
                </v-card>
              </template>
            </div>
          </template>

          <template v-else-if="stage === 'ready'">
            <h3 class="text-title-large px-4 pt-0 pb-3">
              {{ t('io.import.configuration.heading') }}
            </h3>

            <div class="d-flex flex-column gr-5 px-4 pt-2">
              <!-- Packages target 1–3 locales, usually one -->
              <v-card border flat rounded>
                <v-card-item>
                  <v-card-title class="config-card-title">
                    {{ t('io.import.configuration.locales.title') }}
                  </v-card-title>
                  <v-card-subtitle class="config-card-subtitle">
                    {{ t('io.import.configuration.locales.subtitle') }}
                  </v-card-subtitle>
                </v-card-item>
                <v-card-text v-if="targetLocales.length > 1" class="d-flex flex-wrap gc-6">
                  <v-checkbox
                    v-for="locale in targetLocales"
                    :key="locale"
                    v-model="form.locales"
                    class="config-checkbox"
                    density="compact"
                    :label="locale"
                    :value="locale"
                  />
                </v-card-text>
                <!-- A single target locale is always imported, so it's shown as text, not a checkbox -->
                <v-card-text v-else class="config-info">
                  {{ targetLocales.length
                    ? t('io.import.configuration.locales.single', { locale: targetLocales[0] })
                    : t('io.import.configuration.locales.none') }}
                </v-card-text>
              </v-card>

              <v-card border flat rounded>
                <v-card-item>
                  <v-card-title class="config-card-title">
                    {{ t('io.import.configuration.records.title') }}
                  </v-card-title>
                  <v-card-subtitle class="config-card-subtitle">
                    {{ t('io.import.configuration.records.subtitle') }}
                  </v-card-subtitle>
                </v-card-item>
                <v-card-text>
                  <div class="contents-list">
                    <div class="contents-row">
                      <div class="contents-head-title text-label-large text-medium-emphasis">
                        {{ t('io.import.configuration.records.type') }}
                      </div>
                      <div class="contents-col-switch text-label-large text-medium-emphasis d-none d-sm-block">
                        {{ t('io.import.configuration.records.ifExists') }}
                      </div>
                    </div>

                    <div
                      v-for="type in presentTypes"
                      :key="type"
                      class="contents-row"
                    >
                      <v-checkbox
                        v-model="form.include"
                        class="config-checkbox"
                        density="compact"
                        :label="t(`io.import.configuration.records.types.${type}`)"
                        :value="type"
                      />
                      <v-btn-toggle
                        v-model="form.conflictStrategies[type]"
                        class="conflict-slider contents-col-switch"
                        :class="{ 'conflict-slider--disabled': !form.include.includes(type) }"
                        color="primary"
                        :disabled="!form.include.includes(type)"
                        mandatory
                        :style="{ '--thumb-index': thumbIndex(form.conflictStrategies[type]) }"
                        variant="text"
                      >
                        <span aria-hidden="true" class="conflict-slider-thumb" />
                        <v-btn
                          v-for="option in conflictOptions"
                          :key="option.value"
                          class="text-none"
                          :value="option.value"
                        >
                          {{ option.title }}
                        </v-btn>
                      </v-btn-toggle>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <v-card border flat rounded>
                <v-card-item>
                  <v-card-title class="config-card-title">
                    {{ t('io.import.configuration.filters.title') }}
                  </v-card-title>
                  <v-card-subtitle class="config-card-subtitle">
                    {{ t('io.import.configuration.filters.subtitle') }}
                  </v-card-subtitle>
                  <template #append>
                    <div class="d-flex align-center ga-2">
                      <v-chip v-if="activeFilterCount" color="primary" label size="small" variant="tonal">
                        {{ t('io.import.configuration.filters.active', { count: activeFilterCount }) }}
                      </v-chip>
                      <v-btn
                        :append-icon="showFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
                        size="small"
                        variant="text"
                        @click="showFilters = !showFilters"
                      >
                        {{ showFilters ? t('io.import.configuration.filters.hide') : t('io.import.configuration.filters.show') }}
                      </v-btn>
                    </div>
                  </template>
                </v-card-item>
                <v-expand-transition>
                  <v-card-text v-show="showFilters" class="d-flex flex-column gr-4">
                    <v-text-field
                      v-model="form.foodCodes"
                      :hint="t('io.import.configuration.filters.foodCodesHint')"
                      :label="t('io.import.configuration.filters.foodCodes')"
                      persistent-hint
                    />
                    <v-text-field
                      v-model="form.categoryCodes"
                      :hint="t('io.import.configuration.filters.categoryCodesHint')"
                      :label="t('io.import.configuration.filters.categoryCodes')"
                      persistent-hint
                    />
                  </v-card-text>
                </v-expand-transition>
              </v-card>
            </div>

            <div class="d-flex justify-end px-4 pt-6">
              <v-btn color="primary" :disabled="!canStartImport" rounded @click="startImport">
                <v-icon icon="fas fa-file-import" start />
                {{ t('io.import.configuration.start') }}
              </v-btn>
            </div>
          </template>

          <template v-else-if="stage === 'done'">
            <h3 class="text-title-large px-4 pt-0 pb-4">
              {{ t('io.import.result.heading') }}
            </h3>
            <v-list-item class="pb-3" lines="two">
              <template #prepend>
                <v-avatar color="success" icon="$check" />
              </template>
              <v-list-item-title>{{ t('io.import.result.complete') }}</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">
                {{ t('io.import.result.completeHint') }}
              </v-list-item-subtitle>
            </v-list-item>
          </template>

          <template v-else-if="stage === 'import-failed'">
            <h3 class="text-title-large px-4 pt-0 pb-4">
              {{ t('io.import.result.heading') }}
            </h3>
            <div class="px-4 pb-3">
              <v-alert class="mb-5" icon="fas fa-triangle-exclamation" type="error">
                <div class="font-weight-medium">
                  {{ t('io.import.result.failed') }}
                </div>
                <!-- The import job runs in transactions, so a failure rolls everything back -->
                <div class="text-body-medium">
                  {{ t('io.import.result.rolledBack') }}
                </div>
              </v-alert>

              <h4 class="panel-subheader pb-3">
                {{ t('io.import.result.details') }}
              </h4>
              <v-card border flat rounded>
                <div
                  v-for="(line, index) in importFailureLines"
                  :key="index"
                  class="error-row d-flex ga-3 px-4 py-2"
                >
                  <v-icon class="mt-1" color="error" icon="fas fa-circle-exclamation" size="14" />
                  <div class="error-text text-body-medium min-width-0">
                    {{ line }}
                  </div>
                </div>
              </v-card>

              <div class="d-flex align-center justify-space-between flex-wrap ga-2 pt-5">
                <div class="text-body-medium text-medium-emphasis">
                  {{ t('io.import.result.retryHint') }}
                </div>
                <v-btn color="primary" rounded @click="backToOptions">
                  <v-icon icon="fas fa-sliders" start />
                  {{ t('io.import.result.backToOptions') }}
                </v-btn>
              </div>
            </div>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { ConflictStrategy, LocalisableMessage, ProblemGroup } from './package-import';
import type {
  ImportPackageFormat,
  JobAttributes,
  PackageContentsSummary,
  PackageFileType,
  PackageVerificationRequest,
} from '@intake24/common/types/http/admin';

import { computed, onBeforeUnmount, reactive, ref, shallowRef, useTemplateRef } from 'vue';

import { useHttp } from '@intake24/admin/services';
import { useMessages, useUser } from '@intake24/admin/stores';
import { importPackageFormats, packageFileTypes } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';

import {
  buildImportRequest,
  conflictStrategies,
  formatBytes,
  getErrorMessage,
  isZipFile,
  normaliseErrorDetails,
  parseCodeList,
  PollingCancelled,
  UPLOADED_FILE,
  UploadFailure,
  useJobPolling,
  useTusUpload,
  zipAccept,
} from './package-import';

defineOptions({ name: 'ImportPackage' });

type Stage
  = | 'select'
    | 'file-selected'
    | 'uploading'
    | 'verifying'
    | 'verify-failed'
    | 'ready'
    | 'importing'
    | 'done'
    | 'import-failed';

type StepState = 'pending' | 'active' | 'done' | 'failed';

type StepEmphasis = 'current' | 'failed' | 'done' | 'pending';

type Notice = {
  type: 'info' | 'error';
  key: string;
  params?: Record<string, unknown>;
};

type ImportFailure = {
  messages: LocalisableMessage[];
  message: string | null;
};

const formatHelpUrl = 'https://docs.intake24.org/admin/locales/package-format';

// Import job errors that "Back to options" can't recover from: the package has to be uploaded again
const reuploadErrorKeys = ['io.importJob.extractedFilesNotFound', 'io.importJob.invalidVerification'];

const { i18n } = useI18n();
const { t } = i18n;
const http = useHttp();
const messages = useMessages();
const user = useUser();
const upload = useTusUpload();
const polling = useJobPolling();

const fileInput = useTemplateRef('fileInput');

/*
 * Stage transitions
 *
 *   From            To              When
 *   --------------  --------------  ------------------------------------------------------------
 *   select          file-selected   a file is picked or dropped
 *   file-selected   uploading       "Upload and validate" is clicked
 *   uploading       verifying       the upload finishes
 *                   file-selected   the upload fails or is cancelled
 *   verifying       ready           validation passes
 *                   verify-failed   validation fails
 *                   file-selected   "Cancel validation" is clicked (the server job is left to finish)
 *   ready           importing       "Start import" is clicked
 *   importing       done            the import succeeds
 *                   import-failed   the import fails
 *                   file-selected   the uploaded files have expired and must be uploaded again
 *   import-failed   ready           "Back to options" is clicked
 *
 * Picking or dropping a new file also goes to file-selected from any stage except importing.
 */
const stage = ref<Stage>('select');
const packageFormat = ref<ImportPackageFormat>('intake24');
const file = shallowRef<File | null>(null);
const fileId = ref<string | null>(null);
// Kept separately from the file, which is cleared after a successful import
const uploadedSize = ref(0);
// Job results can carry thousands of error messages, so they are kept in shallow refs
const verificationJob = shallowRef<JobAttributes | null>(null);
const summary = shallowRef<PackageContentsSummary | null>(null);
const problems = shallowRef<ProblemGroup[] | null>(null);
const problemCount = ref(0);
const selectedProblemFile = ref<string | null>(null);
const validationMessage = ref<string | null>(null);
const importFailure = shallowRef<ImportFailure | null>(null);
const notice = shallowRef<Notice | null>(null);

// Import options, set to their defaults when validation succeeds and kept through "Back to options"
const form = reactive({
  locales: [] as string[],
  include: [] as PackageFileType[],
  conflictStrategies: {} as Partial<Record<PackageFileType, ConflictStrategy>>,
  foodCodes: '',
  categoryCodes: '',
});
const showFilters = ref(false);

/*
 * Incremented whenever the running upload / validation / import is superseded (file replaced,
 * validation cancelled, page left). Async continuations compare it with the value they started
 * with and stop if it changed, so an abandoned job can never update the page.
 */
let run = 0;

onBeforeUnmount(() => {
  run++;
});

const formats = computed(() => importPackageFormats.map(value => ({
  value,
  title: t(`io.import.package.formats.${value}`),
})));

const conflictOptions = computed(() => conflictStrategies.map(value => ({
  value,
  title: t(`io.import.configuration.conflict.${value}`),
})));

const canUpload = computed(() => user.can('upload-large-files'));
const hasFile = computed(() => !!file.value);
// The format is sent for validation, so it can't change once the upload starts. After a successful
// import no file is selected, so the next package's format can be chosen.
const formatLocked = computed(() => !['select', 'file-selected', 'done'].includes(stage.value));
// Import jobs can't be cancelled, so the package can't be replaced mid-import
const replaceBlocked = computed(() => stage.value === 'importing');

const dropzoneHint = computed(() => {
  if (replaceBlocked.value)
    return t('io.import.package.replaceBlocked');

  return hasFile.value ? t('io.import.package.replace') : t('io.import.package.browse');
});

function formatSize(bytes: number) {
  return formatBytes(bytes, i18n.locale.value);
}

function fileLabel(name: string) {
  return name === UPLOADED_FILE ? t('io.verification.uploadedFile') : name;
}

const dragDepth = ref(0);
const dragActive = computed(() => dragDepth.value > 0 && !replaceBlocked.value);

function invalidateRun() {
  run++;
  upload.abort();
  polling.stop();
}

function clearPackageState() {
  fileId.value = null;
  uploadedSize.value = 0;
  verificationJob.value = null;
  summary.value = null;
  problems.value = null;
  problemCount.value = 0;
  selectedProblemFile.value = null;
  validationMessage.value = null;
  importFailure.value = null;
}

function selectFile(selected: File) {
  if (replaceBlocked.value)
    return;

  if (!isZipFile(selected)) {
    messages.error(t('io.import.package.notZip', { name: selected.name }));
    return;
  }

  invalidateRun();
  clearPackageState();
  notice.value = null;
  file.value = selected;
  stage.value = 'file-selected';
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = input.files?.[0];
  // Reset, so choosing the same file again still triggers a change
  input.value = '';

  if (selected)
    selectFile(selected);
}

// Enter / leave also fire for the zone's children, so count them rather than toggling a flag
function onDragEnter(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files'))
    dragDepth.value++;
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
}

function onDragOver(event: DragEvent) {
  // Default handling is prevented even when replacement is blocked, or the browser would open the
  // dropped file; dropEffect 'none' only shows the not-allowed cursor
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = replaceBlocked.value ? 'none' : 'copy';
}

function onDrop(event: DragEvent) {
  dragDepth.value = 0;

  const dropped = event.dataTransfer?.files?.[0];
  if (dropped && !replaceBlocked.value)
    selectFile(dropped);
}

function uploadFailureNotice(err: unknown): Notice {
  if (!(err instanceof UploadFailure))
    return { type: 'error', key: 'io.import.uploadError.unexpected', params: { message: getErrorMessage(err) } };

  switch (err.reason) {
    case 'cancelled':
      return { type: 'info', key: 'io.import.notice.uploadCancelled' };
    case 'permission':
      return { type: 'error', key: 'io.import.uploadError.permission' };
    case 'tooLarge':
      return { type: 'error', key: 'io.import.uploadError.tooLarge' };
    case 'storage':
      return { type: 'error', key: 'io.import.uploadError.storage' };
    default:
      return { type: 'error', key: 'io.import.uploadError.unexpected', params: { message: err.message } };
  }
}

function applyDefaultOptions(contents: PackageContentsSummary) {
  const present = packageFileTypes.filter(type => contents.files[type]);

  form.locales = [...contents.targetLocales];
  form.include = present;
  form.conflictStrategies = Object.fromEntries(present.map(type => [type, 'overwrite']));
  form.foodCodes = '';
  form.categoryCodes = '';
  showFilters.value = false;
}

function showValidationFailure(groups: ProblemGroup[] | null, message: string | null) {
  problems.value = groups;
  problemCount.value = groups?.reduce((total, group) => total + group.messages.length, 0) ?? 0;
  selectedProblemFile.value = groups?.[0]?.file ?? null;
  validationMessage.value = message;
  stage.value = 'verify-failed';
}

function applyVerificationResult(job: JobAttributes) {
  verificationJob.value = job;

  if (!job.successful) {
    showValidationFailure(normaliseErrorDetails(job.errorDetails), job.message);
    return;
  }

  const contents = job.returnValue as PackageContentsSummary | null;
  if (!contents?.files || !Array.isArray(contents.targetLocales)) {
    showValidationFailure(null, t('io.import.validation.unexpected', { message: 'missing package summary' }));
    return;
  }

  summary.value = contents;
  applyDefaultOptions(contents);
  stage.value = 'ready';
}

async function uploadAndValidate() {
  const selected = file.value;
  if (stage.value !== 'file-selected' || !selected || !canUpload.value)
    return;

  const current = ++run;
  notice.value = null;
  stage.value = 'uploading';

  let uploadedFileId: string;
  try {
    uploadedFileId = await upload.start(selected);
  }
  catch (err) {
    if (current !== run)
      return;

    stage.value = 'file-selected';
    notice.value = uploadFailureNotice(err);
    return;
  }

  if (current !== run)
    return;

  fileId.value = uploadedFileId;
  uploadedSize.value = selected.size;
  stage.value = 'verifying';

  try {
    const request: PackageVerificationRequest = { fileId: uploadedFileId, packageFormat: packageFormat.value };
    const { data } = await http.post<{ jobId: string }>('admin/packages/verify', request);
    if (current !== run)
      return;

    const job = await polling.poll(data.jobId);
    if (current !== run)
      return;

    applyVerificationResult(job);
  }
  catch (err) {
    if (current !== run || err instanceof PollingCancelled)
      return;

    showValidationFailure(null, t('io.import.validation.unexpected', { message: getErrorMessage(err) }));
  }
}

function cancelUpload() {
  // uploadAndValidate() receives the cancellation and returns to file-selected with a notice
  if (stage.value === 'uploading')
    upload.abort();
}

// There's no endpoint to cancel a job: stop polling and ignore the job, which runs to completion
function cancelValidation() {
  if (stage.value !== 'verifying')
    return;

  invalidateRun();
  clearPackageState();
  notice.value = { type: 'info', key: 'io.import.notice.validationCancelled' };
  stage.value = 'file-selected';
}

const currentProblems = computed(() =>
  problems.value?.find(group => group.file === selectedProblemFile.value)?.messages ?? []);

async function copyProblems() {
  const groups = problems.value;
  if (!groups)
    return;

  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`${fileLabel(group.file)} (${group.messages.length})`);
    for (const message of group.messages)
      lines.push(`- ${t(message.key, message.params ?? {})}`);
    lines.push('');
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n').trimEnd());
    messages.success(t('io.import.validation.copied'));
  }
  catch (err) {
    console.error(err);
    messages.error(t('io.import.validation.copyFailed'));
  }
}

const targetLocales = computed(() => summary.value?.targetLocales ?? []);

const presentTypes = computed(() => {
  const contents = summary.value;
  return contents ? packageFileTypes.filter(type => contents.files[type]) : [];
});

// Position of the sliding thumb: 0, 1 or 2; -1 when nothing is selected
function thumbIndex(value: ConflictStrategy | undefined) {
  return value ? conflictStrategies.indexOf(value) : -1;
}

const activeFilterCount = computed(() =>
  [form.foodCodes, form.categoryCodes].filter(value => parseCodeList(value).length > 0).length);

// A package without target locales has nothing to choose from; its import isn't restricted by locale
const canStartImport = computed(() =>
  form.include.length > 0 && (targetLocales.value.length === 0 || form.locales.length > 0));

function showImportFailure(errorDetails: unknown, message: string | null) {
  const failureMessages = normaliseErrorDetails(errorDetails, '')?.flatMap(group => group.messages) ?? [];

  // The uploaded files (or the validation result) are gone: go back to uploading the same file
  if (failureMessages.some(({ key }) => reuploadErrorKeys.includes(key))) {
    clearPackageState();
    notice.value = { type: 'error', key: 'io.import.notice.filesExpired' };
    stage.value = 'file-selected';
    return;
  }

  importFailure.value = { messages: failureMessages, message };
  stage.value = 'import-failed';
}

async function startImport() {
  const job = verificationJob.value;
  if (stage.value !== 'ready' || !canStartImport.value || !fileId.value || !job)
    return;

  const current = ++run;
  importFailure.value = null;
  stage.value = 'importing';

  try {
    const request = buildImportRequest(fileId.value, job.id, form);
    const { data } = await http.post<{ jobId: string }>('admin/packages/import', request);
    if (current !== run)
      return;

    const importJob = await polling.poll(data.jobId);
    if (current !== run)
      return;

    if (importJob.successful) {
      // The file is cleared for the next package, but the stepper keeps showing the completed
      // steps until a new file is picked
      file.value = null;
      stage.value = 'done';
    }
    else {
      showImportFailure(importJob.errorDetails, importJob.message);
    }
  }
  catch (err) {
    if (current !== run || err instanceof PollingCancelled)
      return;

    // FIXME: A lost enqueue response or polling failure leaves the job outcome unknown; retrying may duplicate an import.
    const errorDetails = (err as any)?.response?.data?.details ?? null;
    showImportFailure(errorDetails, getErrorMessage(err));
  }
}

const importFailureLines = computed(() => {
  const failure = importFailure.value;
  if (!failure)
    return [];

  if (failure.messages.length)
    return failure.messages.map(message => t(message.key, message.params ?? {}));

  return [failure.message || t('io.import.result.unexpected')];
});

function backToOptions() {
  if (stage.value === 'import-failed')
    stage.value = 'ready';
}

function formatEta(seconds: number) {
  if (seconds < 60) {
    const count = seconds < 10 ? Math.max(1, Math.ceil(seconds)) : Math.ceil(seconds / 5) * 5;
    return t('io.import.progress.upload.secondsRemaining', count);
  }

  return t('io.import.progress.upload.minutesRemaining', Math.round(seconds / 60));
}

// value: null means indeterminate; cancel: null means the job can't be cancelled
const progressPanel = computed<{
  heading: string;
  icon: string;
  title: string;
  subtitle: string | null;
  value: number | null;
  cancel: { label: string; action: () => void } | null;
} | null>(() => {
  switch (stage.value) {
    case 'uploading': {
      const transferred = t('io.import.progress.upload.transferred', {
        uploaded: formatSize(upload.bytesUploaded.value),
        total: formatSize(upload.bytesTotal.value),
      });
      const remaining = upload.secondsRemaining.value;

      return {
        heading: t('io.import.progress.upload.heading'),
        icon: '$upload',
        title: t('io.import.progress.upload.title', { percent: upload.percent.value }),
        subtitle: remaining === null ? transferred : `${transferred} · ${formatEta(remaining)}`,
        value: upload.percent.value,
        cancel: { label: t('io.import.progress.upload.cancel'), action: cancelUpload },
      };
    }
    case 'verifying':
      return {
        heading: t('io.import.progress.validation.heading'),
        icon: 'fas fa-file-circle-check',
        title: t('io.import.progress.validation.title'),
        subtitle: null,
        value: null,
        cancel: { label: t('io.import.progress.validation.cancel'), action: cancelValidation },
      };
    case 'importing':
      return {
        heading: t('io.import.progress.import.heading'),
        icon: 'fas fa-database',
        title: t('io.import.progress.import.title'),
        // The import job reports no intermediate progress or step names
        subtitle: t('io.import.progress.import.subtitle'),
        value: null,
        // Jobs can't be cancelled
        cancel: null,
      };
    default:
      return null;
  }
});

const steps = computed<{ key: string; title: string; detail: string; icon: string; state: StepState; emphasis: StepEmphasis }[]>(() => {
  const s = stage.value;

  const uploadStep: StepState = ['select', 'file-selected'].includes(s)
    ? 'pending'
    : s === 'uploading' ? 'active' : 'done';
  const verifyStep: StepState = ['select', 'file-selected', 'uploading'].includes(s)
    ? 'pending'
    : s === 'verifying'
      ? 'active'
      : s === 'verify-failed' ? 'failed' : 'done';
  const importStep: StepState = s === 'importing'
    ? 'active'
    : s === 'done'
      ? 'done'
      : s === 'import-failed' ? 'failed' : 'pending';

  const detail = (state: StepState, map: Partial<Record<StepState, string>>) => map[state] ?? '';
  const inProgress = t('io.import.steps.inProgress');

  const list = [
    {
      key: 'upload',
      title: t('io.import.steps.upload._'),
      icon: 'fas fa-cloud-arrow-up',
      detail: detail(uploadStep, {
        pending: s === 'file-selected' ? t('io.import.steps.upload.ready') : t('io.import.steps.upload.waiting'),
        active: inProgress,
        done: t('io.import.steps.upload.done', { size: formatSize(uploadedSize.value) }),
      }),
      state: uploadStep,
    },
    {
      key: 'verify',
      title: t('io.import.steps.validation._'),
      icon: 'fas fa-file-circle-check',
      detail: detail(verifyStep, {
        pending: t('io.import.steps.validation.pending'),
        active: inProgress,
        done: t('io.import.steps.validation.done'),
        failed: problemCount.value
          ? t('io.import.steps.validation.problems', problemCount.value)
          : t('io.import.steps.validation.failed'),
      }),
      state: verifyStep,
    },
    {
      key: 'import',
      title: t('io.import.steps.import._'),
      icon: 'fas fa-database',
      detail: detail(importStep, {
        pending: verifyStep === 'failed' ? t('io.import.steps.import.blocked') : t('io.import.steps.import.pending'),
        active: inProgress,
        done: t('io.import.steps.import.done'),
        failed: t('io.import.steps.import.failed'),
      }),
      state: importStep,
    },
  ];

  const focus = list.findIndex(step => step.state !== 'done');

  return list.map((step, i) => ({
    ...step,
    emphasis: step.state === 'done'
      ? 'done'
      : i === focus
        ? (step.state === 'failed' ? 'failed' : 'current')
        : 'pending',
  }));
});
</script>

<style scoped>
.min-width-0 {
  min-width: 0;
}

/* Vuetify 4's reset only zeroes html/body margins, and the app has no global reset,
   so headings and paragraphs would keep browser-default margins (about 1em each side).
   Zero them so spacing comes only from the utility classes.
   Note: Vuetify's spacing utilities live in a CSS layer and are not !important, so this
   unlayered rule would cancel m*-* classes on these elements — use p*-* padding on them instead. */
h2,
h3,
h4,
p {
  margin: 0;
}

@media (min-width: 960px) {
  .status-panel {
    position: sticky;
    top: 88px;
  }
}

.dropzone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.45);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-primary), 0.04);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.dropzone--selected {
  border-color: rgba(var(--v-theme-success), 0.5);
  background-color: rgba(var(--v-theme-success), 0.05);
}

.dropzone--dragover {
  border-style: solid;
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.dropzone--disabled {
  cursor: not-allowed;
  border-color: rgba(var(--v-border-color), 0.24);
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.dropzone-hint {
  max-width: 100%;
}

.stepper {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 0;
  min-width: 0;
}

.step-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 32px;
  align-self: stretch;
}

.step-number {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  background-color: rgba(var(--v-border-color), 0.06);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.step--current .step-number {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.step--failed .step-number {
  background-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}

.step--done .step-number {
  background-color: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.step-connector {
  width: 2px;
  flex-grow: 1;
  margin-top: 8px;
  border-radius: 1px;
  background-color: rgba(var(--v-border-color), 0.12);
}

.step-connector--done {
  background-color: rgba(var(--v-theme-success), 0.5);
}

.step-avatar {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.step-spinner {
  position: absolute;
  inset: 0;
}

.step-title {
  font-size: 0.9375rem;
  font-weight: 500;
}

.step--current .step-title,
.step--failed .step-title,
.step--done .step-title {
  font-weight: 700;
}

.step--pending .step-title {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Desktop: vertical stepper. Each row's content box is the 56px avatar;
   the 32px number sits 12px down so it is level with the avatar's centre.
   The connector starts 8px below the number and, via a negative margin,
   runs through the row's 20px bottom padding to stop 8px above the next number
   (56 − 44 content left + 24 overflow = 8px gaps at both ends). */
@media (min-width: 960px) {
  .stepper {
    flex-direction: column;
    gap: 0;
  }

  .step {
    align-items: flex-start;
    gap: 16px;
  }

  .step:not(:last-child) {
    padding-bottom: 20px;
  }

  .step-rail {
    padding-top: 12px;
  }

  .step-connector {
    margin-bottom: -24px;
  }

  .step-text {
    align-self: center;
  }

  .step-title {
    font-size: 1.0625rem;
  }
}

.empty-main {
  min-height: 280px;
}

.panel-subheader {
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.5;
}

.problems {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.problems-files {
  max-height: 200px;
  overflow-y: auto;
}

.problems-messages {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Rows are wrapped by the virtual scroller, so the separators go on its item wrappers */
.problems-messages :deep(.v-virtual-scroll__item + .v-virtual-scroll__item) {
  border-top: thin solid rgba(var(--v-border-color), 0.08);
}

@media (min-width: 960px) {
  .problems {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }

  .problems-files {
    max-height: 360px;
  }

  .problems-messages {
    border-top: none;
    border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}

/* Server messages can contain line breaks; long codes and paths must wrap */
.error-text {
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.error-row + .error-row {
  border-top: thin solid rgba(var(--v-border-color), 0.08);
}

/* Vuetify's v-card-title (22px, the same as the panel heading) and single-line 14px v-card-subtitle
   don't fit nested section cards. Card styles sit in a late CSS layer that size utility classes
   don't beat, so these unlayered rules set the sizes instead. */
.config-card-title {
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.5;
}

.config-card-subtitle {
  font-size: 1rem;
  line-height: 1.5;
  white-space: normal;
}

.config-info {
  font-size: 1rem;
  line-height: 1.5;
}

.config-checkbox :deep(.v-label) {
  padding-inline-start: 4px;
}

/* One grid for the whole list; each row is a subgrid, so the switch column lines up across rows.
   The spare 1fr column keeps the switches next to the names instead of pushed right. */
.contents-list {
  display: grid;
  grid-template-columns: minmax(0, max-content) auto 1fr;
}

.contents-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  min-height: 44px;
}

.contents-row + .contents-row {
  border-top: thin solid rgba(var(--v-border-color), 0.06);
}

/* Inset to line up with the checkbox icons below it */
.contents-head-title {
  padding-left: 8px;
}

.contents-col-switch {
  margin-left: 40px;
}

/* The thumb is a third of the track wide, so translating it by --thumb-index × 100% of its own width
   moves it onto the selected option; this relies on equal-width segments.
   Vuetify styles are in CSS layers, so these unlayered overrides need no !important. */
.conflict-slider {
  position: relative;
  height: auto;
  padding: 3px;
  border-radius: 999px;
  background-color: rgba(var(--v-theme-on-surface), 0.06);
}

.conflict-slider-thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / 3);
  border-radius: 999px;
  background-color: rgba(var(--v-theme-primary), 0.14);
  transform: translateX(calc(var(--thumb-index, 0) * 100%));
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.15s ease;
  pointer-events: none;
}

.conflict-slider--disabled .conflict-slider-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}

.conflict-slider :deep(.v-btn) {
  /* Above the thumb; fixed width keeps the bolder active label from shifting anything */
  position: relative;
  z-index: 1;
  width: 96px;
  min-height: 28px;
  min-width: 0;
  padding: 0 12px;
  border-radius: 999px;
  background-color: transparent;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: 400;
  letter-spacing: normal;
  transition: color 0.22s ease;
}

.conflict-slider :deep(.v-btn--active) {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.conflict-slider--disabled :deep(.v-btn) {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

/* The thumb is the selection indicator; hide Vuetify's own active overlay */
.conflict-slider :deep(.v-btn--active > .v-btn__overlay) {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .conflict-slider-thumb,
  .conflict-slider :deep(.v-btn),
  .dropzone {
    transition: none;
  }
}

@media (max-width: 599.98px) {
  .contents-list {
    grid-template-columns: minmax(0, 1fr);
  }

  /* 3 × 96px doesn't fit a phone row: the switch spans the row and the options share its width */
  .contents-row > .conflict-slider {
    /* Starts under the label text (past the 40px checkbox + 4px label gap), full remaining width */
    width: calc(100% - 44px);
    margin: 0 0 8px 44px;
  }

  .conflict-slider :deep(.v-btn) {
    flex: 1 1 0;
    width: auto;
    padding: 0 4px;
  }
}
</style>
