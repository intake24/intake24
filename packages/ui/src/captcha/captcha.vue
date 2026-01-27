<template>
  <div v-if="provider">
    <v-divider class="mx-6 mt-3" />
    <v-card-text class="px-6 pt-2 pb-6 text-caption">
      <component
        :is="provider"
        ref="captcha"
        :sitekey="sitekey"
        size="invisible"
        @challenge-expired="expired"
        @expired="expired"
        @verify="verified"
      />
      <template v-if="provider === 'h-captcha'">
        This site is protected by <a href="https://hCaptcha.com" target="_blank">hCaptcha</a>
        and its
        <a href="https://hcaptcha.com/privacy" target="_blank">Privacy Policy</a> and
        <a href="https://hcaptcha.com/terms" target="_blank">Terms of Service</a>
        apply.
      </template>
      <template v-else>
        This site is protected by
        <a href="https://www.google.com/recaptcha" target="_blank">reCAPTCHA</a>
        and Google
        <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a> and
        <a href="https://policies.google.com/terms" target="_blank">Terms of Service</a>
        apply.
      </template>
    </v-card-text>
  </div>
</template>

<script lang="ts" setup>
import type { CaptchaProvider } from '@intake24/common/security';

import HCaptcha from '@hcaptcha/vue3-hcaptcha';
import { ref, useTemplateRef } from 'vue';
import { VueRecaptcha as ReCaptcha } from 'vue-recaptcha';

defineOptions({
  name: 'Captcha',

  components: { HCaptcha, ReCaptcha },
});

const emit = defineEmits(['expired', 'verified']);

const captcha = useTemplateRef<InstanceType<typeof HCaptcha | typeof ReCaptcha>>('captcha');
const provider = ref<CaptchaProvider | null>(import.meta.env.VITE_CAPTCHA_PROVIDER || null);
const sitekey = ref<string>(import.meta.env.VITE_CAPTCHA_SITEKEY || '');

function execute() {
  captcha.value?.execute();
}

function reset() {
  captcha.value?.reset();
}

function expired() {
  emit('expired');
  reset();
}

function verified(token?: string) {
  emit('verified', token);
}

function executeIfCan() {
  if (!provider.value) {
    verified();
    return;
  }

  execute();
}

defineExpose({
  executeIfCan,
  reset,
});
</script>

<style lang="scss"></style>
