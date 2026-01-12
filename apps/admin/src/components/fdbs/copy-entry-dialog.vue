<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn
        color="secondary"
        :title="$t(`fdbs.${type}.copy`)"
        variant="outlined"
        v-bind="props"
      >
        <v-icon icon="fas fa-copy" start />{{ $t(`fdbs.${type}.copy`) }}
      </v-btn>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t(`fdbs.${type}.copy`) }}
        </v-toolbar-title>
      </v-toolbar>
      <v-form @keydown="clearError" @submit.prevent="confirm">
        <v-card-text class="pa-6 d-flex flex-column gr-4">
          <select-resource
            v-model="data.localeId"
            :error-messages="errors.get('localeId')"
            item-name="englishName"
            :label="$t('locales._')"
            name="localeId"
            resource="locales"
            @update:model-value="errors.clear('localeId')"
          />
          <v-text-field
            v-model="data.code"
            :error-messages="errors.get('code')"
            :label="$t(`fdbs.${type}.code`)"
            name="code"
          />
          <v-text-field
            v-model="data.englishName"
            :error-messages="errors.get('englishName')"
            :label="$t(`fdbs.${type}.englishName`)"
            name="englishName"
          />
          <v-text-field
            v-model="data.name"
            :error-messages="errors.get('name')"
            hide-details="auto"
            :label="$t(`fdbs.${type}.name`)"
            name="name"
            variant="outlined"
          />
        </v-card-text>
      </v-form>
      <v-card-actions class="pb-4">
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="close">
          <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-bold"
          color="info"
          :disabled="errors.any.value"
          variant="text"
          @click.stop="confirm"
        >
          <v-icon icon="$success" start />{{ $t('common.action.confirm._') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from '@intake24/admin/composables';
import type { FoodCopyInput } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';
import { SelectResource } from '../dialogs';

export type CopyEntityForm = FoodCopyInput;

export default defineComponent({
  name: 'CopyEntryDialog',

  components: { SelectResource },

  props: {
    type: {
      type: String as () => 'categories' | 'foods',
      required: true,
    },
    localeId: {
      type: String,
      required: true,
    },
    entryId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const { i18n } = useI18n();
    const router = useRouter();

    const { clearError, data, errors, post } = useForm<CopyEntityForm>({
      data: {
        localeId: props.localeId,
        code: '',
        englishName: '',
        name: '',
      },
    });

    const dialog = ref(false);

    const close = () => {
      dialog.value = false;
    };

    const confirm = async () => {
      const { localeId, name } = data.value;
      const { id } = await post<{ id: string; localeId: string }>(`admin/fdbs/${props.localeId}/${props.type}/${props.entryId}/copy`);

      close();
      useMessages().success(i18n.t('common.msg.created', { name }));
      if (props.localeId !== localeId)
        return;

      await router.push({ name: `fdbs-${props.type}`, params: { id: localeId, entryId: id } });
    };

    return { clearError, close, confirm, data, errors, dialog };
  },
});
</script>
