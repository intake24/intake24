<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="500px">
    <template #activator="{ props }">
      <v-btn :title="$t('common.password.change')" variant="outlined" v-bind="props">
        {{ $t('common.password.change') }}
      </v-btn>
    </template>
    <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="cancel" />
        <v-toolbar-title>
          {{ $t('common.password.change') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-form @keydown="errors.clear($event.target.name)" @submit.prevent="submit">
        <input
          autocomplete="username email"
          class="d-none"
          name="email"
          type="text"
          :value="email"
        >
        <v-card-text class="pa-6 d-flex flex-column gr-4">
          <v-text-field
            v-model="data.passwordCurrent"
            autocomplete="current-password"
            :error-messages="errors.get('passwordCurrent')"
            hide-details="auto"
            :label="$t('common.password.current')"
            name="passwordCurrent"
            prepend-inner-icon="fas fa-key"
            required
            :type="showPassword.current ? 'text' : 'password'"
            variant="outlined"
          >
            <template #append-inner>
              <v-icon class="me-2" @click="showPassword.current = !showPassword.current">
                {{ showPassword.current ? 'fas fa-eye' : 'fas fa-eye-slash' }}
              </v-icon>
            </template>
          </v-text-field>
          <v-text-field
            v-model="data.password"
            autocomplete="new-password"
            :error-messages="errors.get('password')"
            hide-details="auto"
            :label="$t('common.password.new')"
            name="password"
            prepend-inner-icon="fas fa-key"
            required
            :type="showPassword.password ? 'text' : 'password'"
            variant="outlined"
          >
            <template #append-inner>
              <v-icon class="me-2" @click="showPassword.password = !showPassword.password">
                {{ showPassword.password ? 'fas fa-eye' : 'fas fa-eye-slash' }}
              </v-icon>
            </template>
          </v-text-field>
          <v-text-field
            v-model="data.passwordConfirm"
            autocomplete="new-password"
            :error-messages="errors.get('passwordConfirm')"
            hide-details="auto"
            :label="$t('common.password.confirm')"
            name="passwordConfirm"
            prepend-inner-icon="fas fa-key"
            required
            :type="showPassword.confirm ? 'text' : 'password'"
            variant="outlined"
          >
            <template #append-inner>
              <v-icon class="me-2" @click="showPassword.confirm = !showPassword.confirm">
                {{ showPassword.confirm ? 'fas fa-eye' : 'fas fa-eye-slash' }}
              </v-icon>
            </template>
          </v-text-field>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-btn color="primary" size="x-large" type="submit" variant="flat" width="100%">
            {{ $t('common.password.update') }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useForm } from '@intake24/admin/composables';
import { useI18n } from '@intake24/i18n';
import { useMessages } from '@intake24/ui/stores';

defineOptions({ name: 'UserPassword' });

defineProps({
  email: {
    type: String,
    required: true,
  },
});

const { i18n: { t } } = useI18n();

const dialog = ref(false);
const loading = ref(false);
const { data, errors, post, reset } = useForm({ data: {
  passwordCurrent: null,
  password: null,
  passwordConfirm: null,
} });
const showPassword = reactive({
  current: false,
  password: false,
  confirm: false,
});

function close() {
  dialog.value = false;
  reset();
};

function cancel() {
  close();
};

async function submit() {
  loading.value = true;

  try {
    await post('user/password');
    close();
    useMessages().success(t('common.password.updated'));
  }
  finally {
    loading.value = false;
  }
};
</script>
