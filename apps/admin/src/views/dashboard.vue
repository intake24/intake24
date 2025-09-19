<template>
  <div class="d-flex flex-column ga-4">
    <web-push />
    <v-alert
      v-if="!isVerified"
      border="start"
      prominent
      type="warning"
    >
      <div class="d-flex flex-column ga-2">
        <p class="text-subtitle-1 font-weight-medium">
          Your account's email address is not yet verified.
        </p>
        <p class="text-body-2">
          Please check your inbox for a verification email or request a new one by
          clicking the "Verify" button below.
        </p>
        <v-divider style="opacity: 0.5" />
        <div class="align-self-end">
          <v-btn color="primary" :to="{ name: 'verify' }">
            Verify
          </v-btn>
        </div>
      </div>
    </v-alert>
    <v-alert
      v-if="!isAalSatisfied || !hasMfa"
      border="start"
      prominent
      type="warning"
    >
      <div class="d-flex flex-column ga-2">
        <p class="text-subtitle-1 font-weight-medium">
          Multi-factor authentication (MFA) is not yet enabled for your account.
        </p>
        <p class="text-body-2">
          Please navigate to your user profile and enable MFA by adding at least one authentication device.
        </p>
        <v-divider style="opacity: 0.5" />
        <div class="align-self-end">
          <v-btn color="primary" :to="{ name: 'user' }">
            Set up MFA
          </v-btn>
        </div>
      </div>
    </v-alert>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { WebPush } from '@intake24/admin/components/web-push';
import { useUser } from '../stores';

const user = useUser();

const hasMfa = computed(() => !!user.profile?.mfa);
const isAalSatisfied = computed(() => user.isAalSatisfied);
const isVerified = computed(() => user.isVerified);
</script>

<style lang="scss"></style>
