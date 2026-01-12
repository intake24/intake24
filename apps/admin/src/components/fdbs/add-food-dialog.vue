<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <v-btn color="primary" rounded :title="$t('common.action.add')" v-bind="props">
        <v-icon icon="$add" start /> {{ $t('common.action.add') }}
      </v-btn>
    </template>
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('common.action.add') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-form @keydown="clearError" @submit.prevent="confirm">
        <v-card-text class="pa-6 d-flex flex-column gr-4">
          <v-select
            v-model="resource"
            :items="resources"
            name="entity"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props" :title="item.raw.title">
                <template #prepend>
                  <v-icon :icon="item.raw.icon" />
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <v-icon :icon="item.raw.icon" start />
              {{ item.raw.title }}
            </template>
          </v-select>
          <v-text-field
            v-model="data.code"
            :error-messages="errors.get('code')"
            :label="$t(`fdbs.${resource}.code`)"
            name="code"
          />
          <v-text-field
            v-model="data.englishName"
            :error-messages="errors.get('englishName')"
            :label="$t(`fdbs.${resource}.englishName`)"
            name="englishName"
          />
          <v-text-field
            v-model="data.name"
            :error-messages="errors.get('name')"
            :label="$t(`fdbs.${resource}.name`)"
            name="name"
          />
          <category-list
            v-model="data.parentCategories"
            border
            class="mb-6"
            :code
            :errors="errors"
          />
        </v-card-text>
      </v-form>
      <v-card-actions>
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="close">
          <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-bold"
          color="info"
          variant="text"
          @click.stop="confirm"
        >
          <v-icon icon="$success" start />{{ $t('common.action.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from '@intake24/admin/composables';
import type { CategoryEntry, CategoryInput, FoodEntry, FoodInput } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';
import CategoryList from './categories/category-list.vue';

export type CreateEntityForm
  = Pick<FoodInput, 'code' | 'name' | 'englishName' | 'parentCategories'>
    | Pick<CategoryInput, 'code' | 'name' | 'englishName' | 'parentCategories' | 'hidden'>;

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

defineEmits(['add']);

const { i18n: { t } } = useI18n();
const router = useRouter();
const dialog = ref(false);
const resource = ref<'foods' | 'categories'>('foods');

const resources = [
  { title: t('fdbs.foods._'), value: 'foods', icon: '$foods' },
  { title: t('fdbs.categories._'), value: 'categories', icon: '$categories' },
];

const { clearError, data, errors, post } = useForm<CreateEntityForm>({
  data: {
    code: '',
    name: '',
    englishName: '',
    parentCategories: [],
    hidden: false,
  },
});

function close() {
  dialog.value = false;
}

async function confirm() {
  const { id: localeId } = props;
  const data = await post<CategoryEntry | FoodEntry>(`admin/fdbs/${localeId}/${resource.value}`);

  const { id, name, englishName } = data;

  close();
  useMessages().success(t('common.msg.created', { name: name ?? englishName }));
  await router.push({ name: `fdbs-${resource.value}`, params: { id: localeId, entryId: id } });
}
</script>
