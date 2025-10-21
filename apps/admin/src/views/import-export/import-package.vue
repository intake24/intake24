<template>
  <v-container class="file-upload-container">
    <v-row>
      <v-col>
        <h2>File Upload</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card
          class="drop-zone"
          :class="{ 'drag-over': isDragging && !isUploading && !isImporting, 'greyed-out': isUploading || isImporting }"
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
              :disabled="isUploading || isImporting"
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

    <v-row v-if="isUploading || isImporting || message">
      <v-col>
        <v-card>
          <v-card-title>Uploading and verifying package file</v-card-title>
          <v-card-text>
            <v-progress-linear
              v-if="isUploading"
              v-model="progress"
              color="primary"
              height="25"
            >
              {{ progress }}%
            </v-progress-linear>
            <v-btn
              v-if="isUploading"
              class="mt-2"
              color="error"
              @click="cancelUpload"
            >
              Cancel Upload
            </v-btn>
            <v-alert
              v-if="message"
              class="mt-2"
              :text="message"
              :type="isError ? 'error' : 'success'"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Processing Options</v-card-title>
          <v-card-text :disabled="isUploading || isImporting">
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
            <v-radio-group v-model="conflictHandling" :disabled="isUploading || isImporting">
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
          :disabled="isUploading || isImporting || !fileId"
          @click="startImport"
        >
          Import
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { AxiosProgressEvent, Canceler } from 'axios';
import axios from 'axios';
import { reactive, ref } from 'vue';

const fileInput = ref<HTMLInputElement | null>(null);
const fileInputModel = ref<File | null>(null);
const selectedFile = ref<File | null>(null);
const fileId = ref<string | null>(null);
const isUploading = ref(false);
const isImporting = ref(false);
const progress = ref(0);
const message = ref('');
const isError = ref(false);
const isDragging = ref(false);
const cancelRequest = ref<Canceler | null>(null);

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

function handleFileChange(file: File | null) {
  selectedFile.value = file;
  if (file && !isUploading.value) {
    startUpload();
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0 && !isUploading.value) {
    selectedFile.value = event.dataTransfer.files[0];
    fileInputModel.value = selectedFile.value;
    startUpload();
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (!isUploading.value && !isImporting.value) {
    isDragging.value = true;
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

async function startUpload() {
  if (!selectedFile.value) {
    message.value = 'Please select a file first';
    isError.value = true;
    return;
  }

  isUploading.value = true;
  message.value = '';
  isError.value = false;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  const source = axios.CancelToken.source();
  cancelRequest.value = source.cancel;

  try {
    const response = await axios.post('http://localhost:3000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          progress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
        }
      },
      cancelToken: source.token,
    });

    fileId.value = response.data.fileId;
    message.value = 'File uploaded and verified. Click Import to start processing.';
    isError.value = false;
  }
  catch (error: any) {
    if (axios.isCancel(error)) {
      message.value = 'Upload cancelled';
    }
    else {
      message.value = error.response?.data?.message || error.message || 'An unexpected error occurred during upload';
    }
    isError.value = true;
    selectedFile.value = null;
    fileInputModel.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
  finally {
    isUploading.value = false;
    progress.value = 0;
    cancelRequest.value = null;
  }
}

async function startImport() {
  if (!fileId.value)
    return;

  isImporting.value = true;
  message.value = 'Importing file...';
  isError.value = false;

  try {
    await axios.post('http://localhost:3000/import', {
      fileId: fileId.value,
      options,
      conflictHandling: conflictHandling.value,
    });

    message.value = 'File imported successfully';
    isError.value = false;
  }
  catch (error: any) {
    message.value = error.response?.data?.message || error.message || 'An unexpected error occurred during import';
    isError.value = true;
  }
  finally {
    isImporting.value = false;
    selectedFile.value = null;
    fileId.value = null;
    fileInputModel.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

function cancelUpload() {
  if (cancelRequest.value) {
    cancelRequest.value('Upload cancelled by user');
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
