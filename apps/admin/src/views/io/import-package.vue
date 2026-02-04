<template>
  <v-container class="file-upload-container">
    <v-row>
      <v-col>
        <h3>{{ $t('io.import.pageTitle') }}</h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-expansion-panels v-model="panel">
          <!-- Step 1: upload package archive (select file + monitor upload) -->
          <v-expansion-panel value="0">
            <v-expansion-panel-title>
              <template #default>
                <v-row no-gutters>
                  <v-col class="d-flex justify-start align-center" cols="4">
                    <v-icon
                      class="mr-3"
                      :color="uploadComplete ? 'success' : 'primary'"
                      :icon="uploadComplete ? 'fas fa-check-circle' : 'fas fa-cloud-upload-alt'"
                    />
                    <span class="font-weight-bold">{{ $t('io.import.upload.title') }}</span>
                  </v-col>
                  <v-col class="text-medium-emphasis" cols="8">
                    <span v-if="fileSelected">
                      {{ selectedFile?.name }}
                      <span class="text-caption ml-2">
                        ({{ (selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0) }} MB)
                      </span>
                    </span>
                    <span v-else>
                      {{ $t('io.import.upload.subtitle') }}
                    </span>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card
                v-if="!fileSelected"
                class="drop-zone mb-4"
                :class="{ 'drag-over': isDragging && importState === 'selecting-file', 'greyed-out': importState !== 'selecting-file' }"
                @dragleave="handleDragLeave"
                @dragover.prevent="handleDragOver"
                @drop.prevent="handleDrop"
              >
                <v-card-text class="text-center">
                  <p class="drop-message">
                    {{ $t('io.import.upload.dragDrop') }}
                  </p>
                  <v-file-input
                    ref="fileInput"
                    v-model="fileInputModel"
                    class="file-input"
                    :disabled="importState !== 'selecting-file'"
                    hide-details
                    @change="handleFileChange"
                    @dragleave.prevent="handleDragLeave"
                    @dragover.prevent="handleDragOver"
                    @drop.prevent="handleDrop"
                  />
                </v-card-text>
              </v-card>
              <v-row v-if="fileSelected">
                <v-col cols="4" sm="6">
                  <v-select
                    v-if="fileSelected"
                    v-model="packageFormat"
                    class="mt-4"
                    :disabled="importState !== 'selecting-file'"
                    hide-details
                    item-title="title"
                    item-value="value"
                    :items="packageFormats"
                    :label="$t('io.import.upload.format')"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
              <v-row v-if="fileSelected" align="center">
                <v-col class="d-flex align-center" cols="12" sm="8">
                  <v-progress-linear
                    v-if="importState === 'uploading'"
                    v-model="uploadProgress"
                    class="striped"
                    color="primary"
                    height="25"
                  >
                    {{ uploadProgress.toFixed(0) }}%
                  </v-progress-linear>
                  <div v-else-if="uploadComplete" class="text-success d-flex align-center">
                    <v-icon class="mr-2" icon="fas fa-check" />
                    {{ $t('io.import.upload.success') }}
                  </div>
                  <div v-else>
                    {{ $t('io.import.upload.ready') }}
                  </div>
                </v-col>
                <v-col class="text-right" cols="12" sm="4">
                  <v-btn
                    v-if="importState === 'selecting-file' && fileSelected"
                    class="mr-2"
                    color="primary"
                    @click="startUpload"
                  >
                    {{ $t('io.import.upload.uploadButton') }}
                  </v-btn>
                  <v-btn
                    v-if="importState === 'uploading'"
                    color="error"
                    variant="text"
                    @click="cancelUpload"
                  >
                    {{ $t('io.import.upload.cancelButton') }}
                  </v-btn>
                  <v-btn
                    v-if="importState === 'selecting-file' && fileSelected"
                    color="secondary"
                    variant="text"
                    @click="resetState"
                  >
                    {{ $t('io.import.upload.changeFileButton') }}
                  </v-btn>
                </v-col>
              </v-row>
              <v-alert
                v-if="uploadError"
                class="mt-4"
                density="compact"
                :text="uploadError"
                type="error"
                variant="tonal"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Step 2: Process and verify uploaded file -->
          <v-expansion-panel :disabled="importState === 'selecting-file' || importState === 'uploading'" value="1">
            <v-expansion-panel-title>
              <v-row no-gutters>
                <v-col class="d-flex justify-start align-center" cols="4">
                  <v-icon
                    class="mr-3"
                    :color="importState === 'verification-successful' ? 'success' : 'primary'"
                    :icon="importState === 'verification-successful' ? 'fas fa-check-circle' : 'fas fa-shield-alt'"
                  />
                  <span class="font-weight-bold">{{ $t('io.import.verify.title') }}</span>
                </v-col>
                <v-col class="text-medium-emphasis" cols="8">
                  <span v-if="importState === 'verification-successful'">
                    {{ $t('io.import.verify.subtitle.complete') }}
                  </span>
                  <span v-else-if="importState === 'verifying'">
                    {{ $t('io.import.verify.subtitle.verifying') }}
                  </span>
                  <span v-else-if="importState === 'verification-failed'">
                    {{ $t('io.import.verify.subtitle.failed') }}
                  </span>
                  <span v-else>
                    {{ $t('io.import.verify.subtitle.pending') }}
                  </span>
                </v-col>
              </v-row>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="importState === 'verifying'" class="d-flex align-center justify-center py-4">
                <v-progress-circular class="mr-3" color="primary" indeterminate />
                <span>{{ $t('io.import.verify.status.verifying') }}</span>
              </div>
              <div v-else-if="importState === 'verification-successful'" class="text-success d-flex align-center">
                <v-icon class="mr-2" icon="fas fa-check" />
                {{ $t('io.import.verify.success') }}
              </div>
              <template v-if="verifyError">
                <v-row align="center">
                  <v-col class="text-error" cols="12" sm="8">
                    <template v-if="verificationJobStatus?.errorDetails">
                      <div v-if="verificationJobStatus.errorDetails.fileErrors">
                        <v-expansion-panels flat multiple>
                          <v-expansion-panel
                            v-for="(errors, file) in verificationJobStatus.errorDetails.fileErrors"
                            :key="file"
                          >
                            <v-expansion-panel-title>
                              <span class="font-weight-bold mr-2">
                                {{ file === '_uploadedFile' ? $t('io.verification.uploadedFile') : file }}
                              </span>
                              <v-chip color="error" size="small" variant="flat">
                                {{ errors.length }}
                              </v-chip>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                              <v-virtual-scroll
                                :height="200"
                                :items="errors"
                              >
                                <template #default="{ item: error }">
                                  <div class="ml-4 py-1">
                                    {{ $t((error as any).key, (error as any).params || {}) }}
                                  </div>
                                </template>
                              </v-virtual-scroll>
                            </v-expansion-panel-text>
                          </v-expansion-panel>
                        </v-expansion-panels>
                      </div>
                      <template v-else-if="!Array.isArray(verificationJobStatus.errorDetails)">
                        {{ $t(verificationJobStatus.errorDetails.key, verificationJobStatus.errorDetails.params || {}) }}
                      </template>
                      <ul v-else class="ma-0 pa-0">
                        <li v-for="(error, idx) in verificationJobStatus.errorDetails" :key="idx">
                          {{ $t(error.key, error.params || {}) }}
                        </li>
                      </ul>
                    </template>
                    <span v-else>
                      {{ verifyError }}
                    </span>
                  </v-col>
                  <v-col class="text-right" cols="12" sm="4">
                    <v-btn color="primary" @click="resetState">
                      {{ $t('io.import.verify.tryAgainButton') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Panel 3: Import Data -->
          <v-expansion-panel :disabled="importState !== 'verification-successful'" value="2">
            <v-expansion-panel-title>
              <template #default>
                <v-row no-gutters>
                  <v-col class="d-flex justify-start align-center" cols="4">
                    <v-icon
                      class="mr-3"
                      :color="isImportComplete ? 'success' : 'primary'"
                      :icon="isImportComplete ? 'fas fa-check-circle' : 'fas fa-file-import'"
                    />
                    <span class="font-weight-bold">{{ $t('io.import.import.title') }}</span>
                  </v-col>
                  <v-col class="text-medium-emphasis" cols="8">
                    <span v-if="isImportComplete">
                      {{ $t('io.import.import.subtitle.complete') }}
                    </span>
                    <span v-else-if="importState === 'importing'">
                      {{ $t('io.import.import.subtitle.importing') }} {{ uploadProgress.toFixed(0) }}%
                    </span>
                    <span v-else>
                      {{ $t('io.import.import.subtitle.configure') }}
                    </span>
                  </v-col>
                </v-row>
              </template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-title class="px-0">
                  {{ $t('io.import.import.processingOptions') }}
                </v-card-title>
                <v-card-text class="px-0" :disabled="importState === 'importing' || isImportComplete">
                  <v-row>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-2">
                        {{ $t('io.import.import.options.locales') }}
                      </div>
                      <v-checkbox
                        v-for="locale in packageContentsSummary?.targetLocales"
                        :key="locale"
                        v-model="selectedLocales"
                        hide-details
                        :label="locale"
                        :value="locale"
                      />
                      <div v-if="packageContentsSummary?.targetLocales.length === 0" class="text-caption text-medium-emphasis">
                        {{ $t('io.import.import.options.noLocales') }}
                      </div>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-2">
                        {{ $t('io.import.import.options.files._') }}
                      </div>
                      <v-table class="mb-4 import-files-table" density="compact">
                        <thead>
                          <tr>
                            <th class="text-left font-weight-bold" style="width: 1%; white-space: nowrap;">
                              {{ $t('io.import.import.options.files.type') }}
                            </th>
                            <th class="text-left font-weight-bold" style="width: 1%; white-space: nowrap;">
                              {{ $t('io.import.import.options.importRecords') }}
                            </th>
                            <th class="text-left font-weight-bold" style="width: 1%; white-space: nowrap;">
                              {{ $t('io.import.import.conflictHandling') }}
                            </th>
                            <th>
                              <!-- Spacer -->
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="fileKey in availableFiles" :key="fileKey">
                            <td class="font-weight-medium text-no-wrap pr-6">
                              {{ $t(`io.import.import.options.files.${fileKey}`) }}
                            </td>
                            <td class="py-2 text-no-wrap pr-4">
                              <v-checkbox
                                v-model="selectedFiles"
                                density="compact"
                                hide-details
                                :value="fileKey"
                              />
                            </td>
                            <td class="py-2 text-no-wrap pr-4">
                              <v-btn-toggle
                                v-model="conflictStrategies[fileKey]"
                                color="primary"
                                density="compact"
                                :disabled="!selectedFiles.includes(fileKey)"
                                divided
                                group
                                mandatory
                                variant="outlined"
                              >
                                <v-btn value="skip">
                                  {{ $t('io.import.import.conflict.skip') }}
                                </v-btn>
                                <v-btn value="overwrite">
                                  {{ $t('io.import.import.conflict.overwrite') }}
                                </v-btn>
                                <v-btn value="abort">
                                  {{ $t('io.import.import.conflict.abort') }}
                                </v-btn>
                              </v-btn-toggle>
                            </td>
                            <td />
                          </tr>
                          <tr v-if="availableFiles.length === 0">
                            <td class="text-center text-medium-emphasis py-4" colspan="4">
                              {{ $t('io.import.import.options.files.noFiles') }}
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <div class="text-subtitle-1 mb-2">
                        {{ $t('io.import.import.options.filtering') }}
                      </div>
                      <v-text-field
                        v-model="foodCodeFilter"
                        :hint="$t('io.import.import.options.foodCodeFilterHint')"
                        :label="$t('io.import.import.options.foodCodeFilter')"
                        persistent-hint
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="categoryCodeFilter"
                        :hint="$t('io.import.import.options.categoryCodeFilterHint')"
                        :label="$t('io.import.import.options.categoryCodeFilter')"
                        persistent-hint
                        variant="outlined"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <div class="mt-4">
                <v-progress-linear
                  v-if="importState === 'importing'"
                  class="mb-4"
                  color="primary"
                  height="25"
                  indeterminate
                />

                <v-btn
                  block
                  color="primary"
                  :disabled="!canStartImport"
                  size="large"
                  @click="startImport"
                >
                  {{ $t('io.import.import.startButton') }}
                </v-btn>
                <v-alert
                  v-if="importState === 'importing'"
                  class="mt-4"
                  :text="$t('io.import.import.status.importingAlert')"
                  type="info"
                  variant="tonal"
                />
                <v-alert
                  v-if="isImportComplete"
                  class="mt-4"
                  :text="$t('io.import.import.status.success')"
                  type="success"
                  variant="tonal"
                />
                <v-alert
                  v-if="importError"
                  class="mt-4"
                  density="compact"
                  :text="importError"
                  type="error"
                  variant="tonal"
                />
                <v-btn
                  v-if="isImportComplete"
                  block
                  class="mt-4"
                  color="secondary"
                  variant="outlined"
                  @click="resetState"
                >
                  {{ $t('io.import.import.importAnotherButton') }}
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { AxiosInstance, AxiosProgressEvent, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

import type { JobAttributes, PackageContentsSummary, PackageFileType } from '@intake24/common/types/http/admin';

import axios from 'axios';
import * as tus from 'tus-js-client';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { packageFileTypes } from '@intake24/common/types/http/admin';
import { http } from '@intake24/ui';

// Axios client wrappers for tus-js-client

class AxiosHttpResponse implements tus.HttpResponse {
  constructor(private axiosResponse: AxiosResponse) {}

  getStatus(): number {
    return this.axiosResponse.status;
  }

  getHeader(header: string): string | undefined {
    return this.axiosResponse.headers[header.toLowerCase()];
  }

  getBody(): any {
    return this.axiosResponse.data;
  }

  getUnderlyingObject(): any {
    return this.axiosResponse;
  }
}

class AxiosHttpRequest implements tus.HttpRequest {
  private headers: { [key: string]: string } = {};
  private body: any = null;
  private progressHandler: ((bytesSent: number) => void) | null = null;
  private cancelTokenSource: CancelTokenSource = axios.CancelToken.source();

  constructor(
    private method: string,
    private url: string,
    private axiosInstance: AxiosInstance,
  ) {}

  getMethod(): string {
    return this.method;
  }

  getURL(): string {
    return this.url;
  }

  setHeader(header: string, value: string): void {
    this.headers[header] = value;
  }

  getHeader(header: string): string | undefined {
    return this.headers[header];
  }

  setProgressHandler(handler: (bytesSent: number) => void): void {
    this.progressHandler = handler;
  }

  async send(body: any): Promise<tus.HttpResponse> {
    this.body = body;

    const config: AxiosRequestConfig = {
      method: this.method,
      url: this.url,
      headers: {
        ...this.headers,
      },
      data: body,
      cancelToken: this.cancelTokenSource.token,
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (this.progressHandler && progressEvent.lengthComputable) {
          this.progressHandler(progressEvent.loaded);
        }
      },
    };

    try {
      const response = await this.axiosInstance(config);
      return new AxiosHttpResponse(response);
    }
    catch (error: any) {
      if (axios.isCancel(error)) {
        throw new Error('Request aborted');
      }
      throw error;
    }
  }

  async abort(): Promise<void> {
    this.cancelTokenSource.cancel('Upload aborted');
  }

  getUnderlyingObject(): CancelTokenSource {
    return this.cancelTokenSource;
  }
}

class AxiosHttpStack implements tus.HttpStack {
  constructor(private axiosInstance: AxiosInstance) {}

  createRequest(method: string, url: string): tus.HttpRequest {
    return new AxiosHttpRequest(method, url, this.axiosInstance);
  }

  getName(): string {
    return 'axios-http-stack';
  }
}

type ImportState = 'selecting-file' | 'uploading' | 'verifying' | 'verification-failed' | 'verification-successful' | 'importing';

const { t } = useI18n();

const importState = ref<ImportState>('selecting-file');

const fileInput = ref<HTMLInputElement | null>(null);
const fileInputModel = ref<File | null>(null);
const selectedFile = ref<File | null>(null);
const uploadedFileId = ref<string | null>(null);
const uploadProgress = ref(0);

const uploadError = ref<string | null>(null);
const verifyError = ref<string | null>(null);
const importError = ref<string | null>(null);

const verificationJobStatus = ref<JobAttributes | null>(null);
const showDebugInfo = ref(false);

const isDragging = ref(false);
let tusUpload: tus.Upload | null = null;
const isImportComplete = ref(false);
const panel = ref('0');

const conflictStrategies = ref<Partial<Record<PackageFileType, string>>>({});
const packageFormat = ref('intake24');

const packageContentsSummary = ref<PackageContentsSummary | null>(null);
const selectedLocales = ref<string[]>([]);
const selectedFiles = ref<PackageFileType[]>([]);
const foodCodeFilter = ref('');
const categoryCodeFilter = ref('');

const packageFormats = computed(() => [
  { value: 'intake24', title: t('io.import.upload.formats.intake24') },
  { value: 'albane', title: t('io.import.upload.formats.albane') },
  { value: 'gousto', title: t('io.import.upload.formats.gousto') },
]);

const fileSelected = computed(() => !!selectedFile.value);
const uploadComplete = computed(() => !!uploadedFileId.value);
const availableFiles = computed(() => packageFileTypes.filter(fileType => packageContentsSummary.value?.files[fileType]));

const canStartImport = computed(() => {
  if (importState.value === 'importing' || isImportComplete.value)
    return false;

  if (selectedLocales.value.length === 0 || selectedFiles.value.length === 0)
    return false;
  return true;
});

async function handleFileChange(file: File | null) {
  selectedFile.value = file;
  if (file) {
    uploadError.value = null;
    uploadedFileId.value = null; // Reset fileId on new selection
    isImportComplete.value = false;
    // Don't auto-advance on selection, remain in panel 0 (Upload)
  }
  else {
    uploadedFileId.value = null;
    isImportComplete.value = false;
  }
  verificationJobStatus.value = null;
  verifyError.value = null;
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0 && importState.value === 'selecting-file') {
    selectedFile.value = event.dataTransfer.files[0];
    fileInputModel.value = selectedFile.value;
    uploadError.value = null;
    uploadedFileId.value = null;
    isImportComplete.value = false;
  }
  verificationJobStatus.value = null;
  verifyError.value = null;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (importState.value === 'selecting-file') {
    isDragging.value = true;
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

async function verifyPackage() {
  importState.value = 'verifying';
  verifyError.value = null;
  panel.value = '1';

  try {
    // Queue package verification job
    const { data: jobResponse } = await http.post<{ jobId: string }>('/admin/packages/verify', {
      fileId: uploadedFileId.value,
      packageFormat: packageFormat.value,
    });

    // Poll until the job completes
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await http.get<JobAttributes>(`/admin/user/jobs/${jobResponse.jobId}`);

      if (response.status !== 200) {
        verifyError.value = t('io.import.verify.error.unexpected');
        importState.value = 'verification-failed';
        return;
      }

      const jobStatus = response.data;
      verificationJobStatus.value = jobStatus;

      if (jobStatus.completedAt) {
        if (!jobStatus.successful) {
          throw new Error(jobStatus.message || t('io.import.verify.error.unexpected')); // FIXME: why does this throw?
        }
        else {
          const packageSummary = jobStatus.returnValue as PackageContentsSummary;
          if (packageSummary) {
            packageContentsSummary.value = packageSummary;

            selectedLocales.value = [...packageSummary.targetLocales];

            conflictStrategies.value = {};
            selectedFiles.value = [];
            if (packageSummary.files) {
              packageFileTypes.filter(k => packageSummary.files[k]).forEach((k) => {
                conflictStrategies.value[k] = k === 'asServedSets' ? 'skip' : 'overwrite';
                selectedFiles.value.push(k);
              });
            }
          }
        }

        break;
      }
    }

    verifyError.value = null;
    importState.value = verificationJobStatus.value?.successful ? 'verification-successful' : 'verification-failed';

    panel.value = '2';
  }
  catch (err: any) {
    console.error(err);
    verifyError.value = t('io.import.verify.error.unexpected', { message: err.message });
    importState.value = 'verification-failed';
    showDebugInfo.value = false;
  }
}

async function startUpload() {
  if (!selectedFile.value) {
    uploadError.value = t('io.import.upload.error.selectFirst');
    return;
  }

  importState.value = 'uploading';
  uploadError.value = null;
  verifyError.value = null;
  verificationJobStatus.value = null;
  showDebugInfo.value = false;

  try {
    const file = selectedFile.value;

    const upload = new tus.Upload(file, {
      endpoint: '/admin/large-file-upload',
      retryDelays: [0, 1000, 3000, 5000],
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      metadata: {
        filename: file.name,
        filetype: file.type,
      },

      httpStack: new AxiosHttpStack(http.axios),
      onError: (error) => {
        uploadError.value = error.message;
        importState.value = 'selecting-file';
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        uploadProgress.value = (bytesUploaded / bytesTotal) * 100.0;
      },
      onSuccess: async () => {
        if (!upload.url) {
          uploadError.value = t('io.import.upload.error.unexpected');
          importState.value = 'selecting-file';
          console.error('Tus upload URL is missing');
          return;
        }

        const parts = upload.url.split('/');
        const fileId = parts[parts.length - 1];

        uploadedFileId.value = fileId;

        await verifyPackage();
      },
    });

    tusUpload = upload;
    upload.start();
  }
  catch (error: any) {
    uploadError.value = error.message || t('io.import.upload.error.unexpected');
    resetState();
  }
}

async function startImport() {
  if (!uploadedFileId.value || !verificationJobStatus.value?.id)
    return;

  importState.value = 'importing';
  importError.value = null;
  isImportComplete.value = false;

  try {
    const activeStrategies: Record<string, string> = {};

    selectedFiles.value.forEach((file) => {
      if (conflictStrategies.value[file]) {
        activeStrategies[file] = conflictStrategies.value[file];
      }
    });

    // Queue package import job
    const { data: jobResponse } = await http.post<{ jobId: string }>('/admin/packages/import', {
      fileId: uploadedFileId.value,
      verificationJobId: verificationJobStatus.value.id,
      options: {
        conflictStrategies: activeStrategies,
        include: selectedFiles.value,
        localeFilter: selectedLocales.value,
        foodFilter: foodCodeFilter.value.split(',').map(s => s.trim()).filter(s => s.length > 0),
        categoryFilter: categoryCodeFilter.value.split(',').map(s => s.trim()).filter(s => s.length > 0),
      },
    });

    // Poll until the job completes
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await http.get<JobAttributes>(`/admin/user/jobs/${jobResponse.jobId}`);

      if (response.status !== 200) {
        importError.value = t('io.import.import.error.unexpected');
        return;
      }

      const jobStatus = response.data;

      if (jobStatus.completedAt) {
        if (!jobStatus.successful) {
          throw new Error(jobStatus.message || t('io.import.import.error.unexpected'));
        }
        break;
      }
    }

    importError.value = null;
    isImportComplete.value = true;
  }
  catch (error: any) {
    importError.value = error.response?.data?.message || error.message || t('io.import.import.error.unexpected');
  }
  finally {
    importState.value = 'selecting-file';
  }
}

function cancelUpload() {
  if (tusUpload) {
    tusUpload.abort(true).catch((err) => {
      console.error('Error aborting upload:', err);
    });
    uploadError.value = t('io.import.upload.status.cancelled');
    resetState();
  }
}

function resetState() {
  importState.value = 'selecting-file';
  uploadProgress.value = 0;
  selectedFile.value = null;
  uploadedFileId.value = null;
  fileInputModel.value = null;

  uploadError.value = null;
  verifyError.value = null;
  importError.value = null;
  verificationJobStatus.value = null;
  showDebugInfo.value = false;

  tusUpload = null;
  isImportComplete.value = false;
  panel.value = '0';
  if (fileInput.value) {
    fileInput.value.value = '';
  }

  packageContentsSummary.value = null;
  selectedLocales.value = [];
  selectedFiles.value = [];
  foodCodeFilter.value = '';
}
</script>

<style scoped>
.drop-zone {
  padding: 3rem;
  border: 2px dashed #666;
  min-height: 150px;
}

.drop-message {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.drag-over {
  background-color: #e8f5e9;
  border: 2px dashed #4caf50;
}

.drag-over .drop-message {
  color: #4caf50;
}

.greyed-out {
  opacity: 0.5;
  background-color: #f5f5f5;
  border: 2px dashed #999;
}

.greyed-out .drop-message {
  color: #666;
}

.file-input {
  margin-top: 0;
}

.mt-2 {
  margin-top: 0.5rem;
}

.import-files-table :deep(tbody tr:nth-of-type(even)) {
  background-color: rgba(0, 0, 0, 0.03); /* Very light grey */
}

.import-files-table :deep(th),
.import-files-table :deep(td) {
  border-bottom: none !important;
}
</style>
