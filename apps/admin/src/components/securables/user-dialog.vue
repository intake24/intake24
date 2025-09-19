<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn
        class="font-weight-bold"
        color="secondary"
        variant="outlined"

        v-bind="props"
        @click.stop="add"
      >
        <v-icon icon="fas fa-user-plus" start />{{ $t('securables.add') }}
      </v-btn>
    </template>
    <v-card :loading="isLoading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
        <v-toolbar-title>
          {{ $t(`securables.${isEdit ? 'edit' : 'add'}`) }}
        </v-toolbar-title>
        <template v-if="!isEdit" #extension>
          <v-tabs v-model="tab" grow>
            <v-tab key="search">
              <v-icon icon="$search" start />
              {{ $t('securables.search') }}
            </v-tab>
            <v-tab key="create">
              <v-icon icon="fas fa-user-plus" start />
              {{ $t('securables.create') }}
            </v-tab>
          </v-tabs>
        </template>
      </v-toolbar>
      <v-form @keydown="clearError" @submit.prevent="save">
        <v-tabs-window v-model="tab">
          <v-tabs-window-item value="search">
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <template v-if="isEdit && selected">
                    <v-text-field
                      disabled
                      :error-messages="errors.get('userId')"
                      hide-details="auto"
                      :label="$t('common.email')"
                      :model-value="`${selected.email} / ${selected.name}`"
                      name="userId"
                      prepend-inner-icon="fas fa-user"
                      variant="outlined"
                    />
                  </template>
                  <template v-else>
                    <auto-complete
                      v-model="data.userId"
                      :api="`${api}/users`"
                      clearable
                      :error-messages="errors.get('userId')"
                      hide-no-data
                      hide-selected
                      item-title="email"
                      item-value="id"
                      :label="$t('common.email')"
                      name="userId"
                      prepend-inner-icon="fas fa-users"
                      @update:model-value="errors.clear('userId')"
                    />
                  </template>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tabs-window-item>
          <v-tabs-window-item value="create">
            <v-card flat>
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="data.email"
                      :error-messages="errors.get('email')"
                      hide-details="auto"
                      :label="$t('common.email')"
                      name="email"
                      prepend-inner-icon="fas fa-at"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="data.name"
                      :error-messages="errors.get('name')"
                      hide-details="auto"
                      :label="$t('users.name')"
                      name="name"
                      prepend-inner-icon="fas fa-user"
                      variant="outlined"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="data.phone"
                      :error-messages="errors.get('phone')"
                      hide-details="auto"
                      :label="$t('common.phone')"
                      name="phone"
                      prepend-inner-icon="fas fa-phone"
                      variant="outlined"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
        <v-card-title>{{ $t('securables.actions.title') }}</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col v-for="action in actions" :key="action" cols="12" sm="6">
              <v-checkbox-btn
                v-model="data.actions"
                hide-details="auto"
                :label="$t(`securables.actions.${action}`)"
                :prepend-inner-icon="
                  data.actions.includes(action) ? `fas fa-unlock` : `fas fa-lock`
                "
                :value="action"
                @update:model-value="errors.clear('actions')"
              />
            </v-col>
          </v-row>
          <error-list :errors="nonInputErrors" />
        </v-card-text>
        <v-card-actions>
          <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
            <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
          </v-btn>
          <v-spacer />
          <v-btn
            class="font-weight-bold"
            color="info"
            :disabled="errors.any.value"
            type="submit"
            variant="text"
          >
            <v-icon icon="$save" start />{{ $t('common.action.save') }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import pick from 'lodash/pick';
import { computed, defineComponent, ref } from 'vue';

import { AutoComplete, ErrorList } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import type { SecurableAction } from '@intake24/common/security';
import type { UserSecurableListEntry } from '@intake24/common/types/http/admin';

export type UserDialogForm = {
  userId: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  actions: string[];
};

export default defineComponent({
  name: 'UserDialog',

  components: { AutoComplete, ErrorList },

  props: {
    api: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    actions: {
      type: Array as PropType<readonly SecurableAction[]>,
      required: true,
    },
  },

  emits: ['update:table'],

  setup(props, { emit }) {
    const http = useHttp();

    const dialog = ref(false);
    const tab = ref<'create' | 'search'>('search');
    const selected = ref<UserSecurableListEntry | null>(null);

    const form = useForm<UserDialogForm>({ data: {
      userId: null,
      email: null,
      name: null,
      phone: null,
      actions: [],
    } });
    const { clearError, data, errors } = form;

    const nonInputErrorKeys = ['actions'];
    const isLoading = ref(false);

    const isEdit = computed(() => !!selected.value);
    const isNew = computed(() => tab.value === 'create');
    const nonInputErrors = computed(() => Object.values(pick(errors.all.value, nonInputErrorKeys)));

    function add() {
      form.reset();
      selected.value = null;
      dialog.value = true;
    };

    function edit(item: UserSecurableListEntry) {
      const { id: userId, securables } = item;
      form.load({ userId, actions: securables.map(({ action }) => action) });
      selected.value = item;
      dialog.value = true;
    };

    function reset() {
      dialog.value = false;
      form.reset();
      selected.value = null;
      tab.value = 'search';
    };

    async function save() {
      if (isNew.value)
        await form.post(props.api);
      else await form.patch(`${props.api}/${data.value.userId}`);

      reset();
      emit('update:table');
    };

    async function remove(userId: string) {
      await http.delete(`${props.api}/${userId}`);

      reset();
      emit('update:table');
    };

    return {
      add,
      edit,
      clearError,
      dialog,
      data,
      errors,
      isEdit,
      isLoading,
      nonInputErrors,
      remove,
      reset,
      save,
      selected,
      tab,
    };
  },
});
</script>

<style lang="scss" scoped></style>
