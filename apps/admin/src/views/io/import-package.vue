<template>
  <v-container class="file-upload-container">
    <v-row>
      <v-col>
        <h2>Import food database package</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card
          class="drop-zone"
          :class="{ 'drag-over': isDragging && uploadState === 'idle', 'greyed-out': uploadState !== 'idle' }"
          @dragleave="handleDragLeave"
          @dragover.prevent="handleDragOver"
          @drop.prevent="handleDrop"
        >
          <v-card-text class="text-center">
            <p class="drop-message">
              Drag and drop a file here or click to select
            </p>
            <v-file-input
              ref="fileInput"
              v-model="fileInputModel"
              class="file-input"
              :disabled="uploadState !== 'idle'"
              hide-details
              @change="handleFileChange"
              @dragleave.prevent="handleDragLeave"
              @dragover.prevent="handleDragOver"
              @drop.prevent="handleDrop"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="uploadState !== 'idle' || statusMessage">
      <v-col>
        <v-card>
          <v-card-title>{{ progressTitle }}</v-card-title>
          <v-card-text>
            <v-progress-linear
              v-if="uploadState !== 'idle'"
              v-model="progress"
              color="primary"
              height="25"
            >
              {{ progress.toFixed(2) }}%
            </v-progress-linear>
            <v-btn
              v-if="uploadState === 'uploading'"
              class="mt-2"
              color="error"
              @click="cancelUpload"
            >
              Cancel Upload
            </v-btn>
            <v-alert
              v-if="statusMessage"
              class="mt-2"
              :text="statusMessage"
              :type="isErrorStatus ? 'error' : 'success'"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Processing Options</v-card-title>
          <v-card-text :disabled="uploadState !== 'idle'">
            <v-row>
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="options.option1"
                  hide-details
                  label="Option 1"
                />
                <v-checkbox
                  v-model="options.option2"
                  hide-details
                  label="Option 2"
                />
                <v-checkbox
                  v-model="options.option3"
                  hide-details
                  label="Option 3"
                />
                <v-checkbox
                  v-model="options.option4"
                  hide-details
                  label="Option 4"
                />
                <v-checkbox
                  v-model="options.option5"
                  hide-details
                  label="Option 5"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="options.option6"
                  hide-details
                  label="Option 6"
                />
                <v-checkbox
                  v-model="options.option7"
                  hide-details
                  label="Option 7"
                />
                <v-checkbox
                  v-model="options.option8"
                  hide-details
                  label="Option 8"
                />
                <v-checkbox
                  v-model="options.option9"
                  hide-details
                  label="Option 9"
                />
                <v-checkbox
                  v-model="options.option10"
                  hide-details
                  label="Option 10"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Conflict Handling</v-card-title>
          <v-card-text>
            <v-radio-group v-model="conflictHandling" :disabled="uploadState !== 'idle'">
              <v-radio label="Skip" value="skip" />
              <v-radio label="Overwrite" value="overwrite" />
              <v-radio label="Abort" value="abort" />
            </v-radio-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-btn
          color="primary"
          :disabled="uploadState !== 'idle' || !fileId"
          @click="startImport"
        >
          Import
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { AxiosInstance, AxiosProgressEvent, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import axios from 'axios';
import * as tus from 'tus-js-client';
import { computed, reactive, ref } from 'vue';
import { httpService } from '../../services';

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

// Custom HttpRequest builder for tus-js-client v4.x
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
        // Ensure tus headers are preserved
        // 'Tus-Resumable': '1.0.0',
      },
      data: body,
      cancelToken: this.cancelTokenSource.token,
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (this.progressHandler && progressEvent.lengthComputable) {
          // Call tus progress handler with bytes sent
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
    return this.cancelTokenSource; // Expose for external control if needed
  }
}

// Custom Axios-based HttpStack for tus-js-client v4.x
class AxiosHttpStack implements tus.HttpStack {
  constructor(private axiosInstance: AxiosInstance) {}

  createRequest(method: string, url: string): tus.HttpRequest {
    return new AxiosHttpRequest(method, url, this.axiosInstance);
  }

  getName(): string {
    return 'axios-http-stack';
  }
}

type UploadState = 'idle' | 'uploading' | 'verifying' | 'importing';

const fileInput = ref<HTMLInputElement | null>(null);
const fileInputModel = ref<File | null>(null);
const selectedFile = ref<File | null>(null);
const fileId = ref<string | null>(null);
const uploadState = ref<UploadState>('idle');
const progress = ref(0);
const statusMessage = ref('');
const isErrorStatus = ref(false);
const isDragging = ref(false);
let tusUpload: tus.Upload | null = null;

const options = reactive({
  option1: true,
  option2: true,
  option3: true,
  option4: true,
  option5: true,
  option6: true,
  option7: true,
  option8: true,
  option9: true,
  option10: true,
});
const conflictHandling = ref('skip');

const progressTitle = computed(() => {
  switch (uploadState.value) {
    case 'uploading':
      return 'Uploading Package File';
    case 'verifying':
      return 'Verifying Package File';
    case 'importing':
      return 'Importing Package File';
    default:
      return 'Processing Package File';
  }
});

function handleFileChange(file: File | null) {
  selectedFile.value = file;
  if (file && uploadState.value === 'idle') {
    startUpload();
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0 && uploadState.value === 'idle') {
    selectedFile.value = event.dataTransfer.files[0];
    fileInputModel.value = selectedFile.value;
    startUpload();
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (uploadState.value === 'idle') {
    isDragging.value = true;
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

async function startUpload() {
  if (!selectedFile.value) {
    statusMessage.value = 'Please select a file first';
    isErrorStatus.value = true;
    return;
  }

  uploadState.value = 'uploading';
  statusMessage.value = '';
  isErrorStatus.value = false;

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

      httpStack: new AxiosHttpStack(httpService.axios),
      onError: (error) => {
        statusMessage.value = error.message;
        isErrorStatus.value = true;
        uploadState.value = 'idle';
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        progress.value = (bytesUploaded / bytesTotal) * 100.0;
      },
      onSuccess: () => {
        statusMessage.value = '';
        isErrorStatus.value = false;
        uploadState.value = 'idle';
      },
    });

    upload.start();
  }
  catch (error: any) {
    statusMessage.value = error.message || 'An unexpected error occurred during upload';
    isErrorStatus.value = true;
    resetUploadState();
  }
}

async function startImport() {
  if (!fileId.value)
    return;

  uploadState.value = 'importing';
  statusMessage.value = 'Importing file...';
  isErrorStatus.value = false;

  try {
    // Simulate progress for import stage
    for (let i = 0; i <= 100; i += 10) {
      progress.value = i;
      await new Promise(resolve => setTimeout(resolve, 300)); // Mock import progress
    }

    await httpService.post('/import', {
      fileId: fileId.value,
      options,
      conflictHandling: conflictHandling.value,
    });

    statusMessage.value = 'File imported successfully';
    isErrorStatus.value = false;
  }
  catch (error: any) {
    statusMessage.value = error.response?.data?.message || error.message || 'An unexpected error occurred during import';
    isErrorStatus.value = true;
  }
  finally {
    resetUploadState();
  }
}

function cancelUpload() {
  if (tusUpload) {
    tusUpload.abort(true).catch((err) => {
      console.error('Error aborting upload:', err);
    });
    statusMessage.value = 'Upload cancelled';
    isErrorStatus.value = true;
    resetUploadState();
  }
}

function resetUploadState() {
  uploadState.value = 'idle';
  progress.value = 0;
  selectedFile.value = null;
  fileId.value = null;
  fileInputModel.value = null;
  tusUpload = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}
</script>

<style scoped>
.file-upload-container {
  font-size: 1.2rem; /* Increased font size for overall component */
}

.drop-zone {
  padding: 3rem; /* Increased padding for drag-and-drop area */
  border: 2px dashed #666; /* Gray dashed border by default */
  min-height: 150px; /* Minimum height to stabilize layout */
}

.drop-message {
  font-size: 1.5rem; /* Increased font size for drop message */
  margin-bottom: 1.5rem; /* Space between message and file input */
}

.drag-over {
  background-color: #e8f5e9; /* Light green background when dragging */
  border: 2px dashed #4caf50; /* Green border when dragging */
}

.drag-over .drop-message {
  color: #4caf50; /* Green text when dragging */
}

.greyed-out {
  opacity: 0.5; /* Reduced opacity for greyed-out effect */
  background-color: #f5f5f5; /* Light grey background */
  border: 2px dashed #999; /* Lighter grey dashed border */
}

.greyed-out .drop-message {
  color: #666; /* Grey text */
}

.file-input {
  margin-top: 0; /* Ensure consistent spacing */
}

.mt-2 {
  margin-top: 0.5rem; /* Spacing for cancel button and alert */
}
</style>
