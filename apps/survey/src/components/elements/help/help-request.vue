<template>
  <v-dialog
    v-model="dialog"
    attach="body"
    :fullscreen="$vuetify.display.smAndDown"
    max-width="500px"
    transition="dialog-bottom-transition"
  >
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-btn
          v-if="mobile"
          class="order-3 nav-item__help"
          v-bind="props"
          value="help"
        >
          <v-icon icon="$info" />
          <span>{{ $t('common.help.request._') }}</span>
        </v-btn>
        <v-btn
          v-else
          color="grey"
          v-bind="props"
          :title="$t('common.help.request.title')"
          variant="flat"
        >
          <v-icon icon="$info" start />
          {{ $t('common.help.request._') }}
        </v-btn>
      </slot>
    </template>
    <v-card :tile="mobile">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" @click.stop="close" />
        <v-toolbar-title>{{ $t('common.help.request.title') }}</v-toolbar-title>
      </v-toolbar>
      <v-form @keydown="errors.clear()" @submit.prevent="requestHelp">
        <v-card-text>
          <p class="mb-4">
            {{ $t('common.help.request.text') }}
          </p>
          <v-row>
            <v-col v-if="settings.available.includes('name')" cols="12">
              <v-text-field
                v-model="form.name"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('common.name')"
                name="name"
                prepend-inner-icon="fas fa-user"
              />
            </v-col>
            <v-col v-if="settings.available.includes('email')" cols="12">
              <v-text-field
                v-model="form.email"
                :error-messages="errors.get('email')"
                hide-details="auto"
                :label="$t('common.email')"
                name="email"
                prepend-inner-icon="fas fa-envelope"
              />
            </v-col>
            <template v-if="settings.available.includes('phone')">
              <v-col cols="4">
                <v-autocomplete
                  v-model="form.phoneCountry"
                  hide-details="auto"
                  :items="regionCodes"
                  name="phoneCountry"
                  single-line
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.text">
                      <template #prepend>
                        <span :class="`fi fi-${item.value.toLowerCase()} me-3`" />
                      </template>
                    </v-list-item>
                  </template>
                  <template #selection="{ item }">
                    <span :class="`fi fi-${item.value.toLowerCase()} me-3`" />
                    {{ item.raw.countryCode }}
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col cols>
                <v-text-field
                  v-model="form.phone"
                  :error-messages="errors.get('phone')"
                  hide-details="auto"
                  :label="$t('common.phone')"
                  name="phone"
                  prepend-inner-icon="fas fa-phone"
                />
              </v-col>
            </template>
            <v-col v-if="settings.available.includes('message')" cols="12">
              <v-textarea
                v-model="form.message"
                :counter="500"
                :error-messages="errors.get('message')"
                hide-details="auto"
                :label="$t('common.message')"
                name="message"
                prepend-inner-icon="fas fa-message"
              />
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col :cols="mobile ? '12' : 'auto'">
              <v-btn
                :block="mobile"
                color="primary"
                :disabled="errors.any()"
                rounded
                size="x-large"
                :title="$t('common.help.request.title')"
                type="submit"
                variant="outlined"
              >
                <v-icon icon="fas fa-circle-question" start />
                {{ $t('common.help.request.title') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { getCountryCodeForRegionCode, getSupportedRegionCodes } from 'awesome-phonenumber';
import axios, { HttpStatusCode } from 'axios';
import { ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import type { SchemeSettings } from '@intake24/common/surveys';
import type { SurveyHelpRequest } from '@intake24/common/types/http';
import { Errors } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { surveyService } from '@intake24/survey/services';
import { useMessages } from '@intake24/survey/stores';

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
  settings: {
    type: Object as PropType<SchemeSettings['help']>,
    required: true,
  },
});

const emit = defineEmits(['open', 'close']);

const { mobile } = useDisplay();
const { i18n: { t } } = useI18n();

const regionCodes = getSupportedRegionCodes().map((code) => {
  const countryCode = `+${getCountryCodeForRegionCode(code)}`;

  return {
    text: `${t(`flags.${code.toLowerCase()}`)} (${countryCode})`,
    value: code,
    countryCode,
  };
});

const dialog = ref(false);
const errors = ref(new Errors());

function createForm(): SurveyHelpRequest {
  return {
    name: '',
    email: '',
    phone: '',
    phoneCountry: window.navigator.language.split('-')[1] ?? 'GB',
    message: '',
  };
}

const form = ref(createForm());

function reset() {
  form.value = createForm();
  errors.value.clear();
}

function close() {
  reset();
  dialog.value = false;
}

watch(dialog, (val) => {
  emit(val ? 'open' : 'close');
});

async function requestHelp() {
  const { surveyId } = props;

  try {
    await surveyService.requestHelp(surveyId, form.value);
    useMessages().info(t('common.help.request.sent'));
    close();
  }
  catch (err) {
    if (
      axios.isAxiosError(err)
      && err.response?.status === HttpStatusCode.BadRequest
      && 'errors' in err.response.data
    ) {
      errors.value.record(err.response.data.errors);
      return;
    }

    throw err;
  }
}
</script>
