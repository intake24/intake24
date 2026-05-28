<template>
  <v-row class="align-start pt-2 justify-center">
    <v-col cols="12" md="6">
      <v-card>
        <v-sheet class="d-flex justify-center" color="ternary" tile>
          <v-card-title>
            <h2>{{ $t('common._') }}</h2>
          </v-card-title>
        </v-sheet>
        <v-card-text class="d-flex flex-column flex-sm-row justify-center align-center pa-6">
          <v-icon class="me-sm-6" color="warning" size="large">
            fas fa-exclamation-triangle
          </v-icon>
          <span class="text-body-large">
            Oops ... Something went wrong. Survey could not be loaded.
          </span>
        </v-card-text>
        <v-card-text class="pa-6">
          <div class="text-title-small">
            Details
          </div>
          <p>Network error</p>
        </v-card-text>
        <v-divider class="mx-6" />
        <router-link
          class="text-decoration-none"
          :to="{ name: 'survey-home', params: { surveyId } }"
        >
          <div v-ripple class="d-flex flex-column flex-sm-row justify-center align-center py-6">
            <v-icon class="py-3 me-sm-6" size="100">
              fas fa-sync-alt
            </v-icon>
            <span class="py-3 text-headline-medium font-weight-bold text--primary text-uppercase">
              {{ $t('common.action.reload') }}
            </span>
          </div>
        </router-link>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SurveyError',

  props: {
    error: {
      type: String,
      required: true,
    },
    surveyId: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
