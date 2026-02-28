<template>
  <div class="d-flex flex-column ga-4">
    <v-switch
      v-model="params.force"
      :error-messages="errors.get('params.force')"
      :label="$t('jobs.types.LocaleIndexBuild.force')"
      name="force"
    />
  </div>
</template>

<script lang="ts" setup>
import { createJobParamProps, useJobParams } from './use-job-params';

const props = defineProps(createJobParamProps<'LocaleIndexBuild'>());

const emit = defineEmits(['update:modelValue']);

const { params } = useJobParams<'LocaleIndexBuild'>(props, { emit });
</script>

<style scoped></style>
