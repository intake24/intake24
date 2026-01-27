<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn class="ml-3" variant="text" v-bind="props">
        <v-icon class="mr-2">
          fas fa-user-shield
        </v-icon>
        {{ owner ? owner.name : $t('common.none') }}
      </v-btn>
    </template>
    <v-card :loading="isLoading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
        <v-toolbar-title>
          {{ $t('securables.owner.title') }}
        </v-toolbar-title>
        <template #extension>
          <div class="mx-auto">
            <v-icon icon="$search" start />{{ $t('securables.search') }}
          </div>
        </template>
      </v-toolbar>
      <v-form @submit.prevent="save">
        <v-container>
          <v-card-text>
            <v-row>
              <v-col cols="12">
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
                  prepend-inner-icon="fas fa-user-shield"
                  :selected="owner"
                  @update:model-value="errors.clear('userId')"
                  @update:object="internalOwner = $event"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-container>
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

import type { UserAttributes } from '@intake24/common/types/http/admin';

import { defineComponent, ref } from 'vue';

import { AutoComplete } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { useEntry } from '@intake24/admin/stores';

type OwnerDialogForm = {
  userId: string | null;
};

export type Owner = Pick<UserAttributes, 'id' | 'name' | 'email'>;

export default defineComponent({
  name: 'OwnerDialog',

  components: { AutoComplete },

  props: {
    api: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    owner: {
      type: Object as PropType<Owner>,
    },
  },

  setup(props) {
    const dialog = ref(false);
    const internalOwner = ref(props.owner ? { ...props.owner } : undefined);
    const isLoading = ref(false);

    const { data, errors, post } = useForm<OwnerDialogForm>({ data: { userId: null } });

    function reset() {
      dialog.value = false;
    };

    async function save() {
      await post(`${props.api}/owner`);

      const partialEntry = internalOwner.value
        ? { ownerId: internalOwner.value.id, owner: internalOwner.value }
        : { ownerId: null, owner: null };

      useEntry().updateEntry(partialEntry);

      reset();
    };

    return {
      data,
      errors,
      dialog,
      internalOwner,
      isLoading,
      reset,
      save,
    };
  },

  watch: {
    dialog(val: boolean) {
      if (!val)
        return;

      this.data.userId = this.owner?.id ?? null;
    },
  },
});
</script>

<style lang="scss" scoped></style>
