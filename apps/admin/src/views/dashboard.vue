<template>
  <div class="d-flex flex-column ga-4 pa-4 pa-md-0">
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
        <v-divider class="my-4 opacity-50" />
        <div class="align-self-end">
          <v-btn color="primary" :to="{ name: 'verify' }">
            Verify
          </v-btn>
        </div>
      </div>
    </v-alert>
    <v-alert
      v-if="!hasMfa"
      border="start"
      prominent
      :type="isAalSatisfied ? 'warning' : 'error'"
    >
      <div class="d-flex flex-column ga-2">
        <p class="text-subtitle-1 font-weight-medium">
          Multi-factor authentication (MFA) is not yet enabled for your account.
        </p>
        <p class="text-body-2">
          Navigate to your user profile and enable MFA by adding at least one authentication device.
          More information about MFA and how to set it up can be found in
          <a
            class="text-decoration-none text-primary-darken-2 font-weight-bold"
            href="https://docs.intake24.org/admin/user/profile#multi-factor-authentication"
            target="_blank"
          >
            documentation</a>.
        </p>
        <v-divider class="my-4 opacity-50" />
        <div
          class="d-flex flex-column ga-2 flex-md-row"
          :class="isAalSatisfied ? 'justify-md-end' : 'justify-md-space-between'"
        >
          <div v-if="!isAalSatisfied" class="bg-error px-4 py-3 rounded-lg font-weight-medium">
            <v-icon class="me-2" icon="fas fa-exclamation-triangle" />
            Your access is limited until MFA is enabled.
          </div>
          <v-btn color="primary" size="large" :to="{ name: 'user' }">
            <v-icon class="me-2" icon="fas fa-fingerprint" />
            Set up MFA
          </v-btn>
        </div>
      </div>
    </v-alert>
    <web-push />
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
