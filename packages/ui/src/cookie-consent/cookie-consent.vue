<template>
  <slot :open="showPreferences" />
</template>

<script lang="ts" setup>
import { useCookieConsent } from './plugin';

function showPreferences() {
  useCookieConsent().showPreferences();
}
</script>
