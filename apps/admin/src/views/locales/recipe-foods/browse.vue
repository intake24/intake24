<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="save">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('locales.recipe-foods.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="secondary"
        icon="$add"
        size="small"
        :title="$t('locales.recipe-foods.add')"
        @click.stop="add"
      />
    </v-toolbar>
    <v-list class="list-border">
      <v-list-item v-for="(item, idx) in data.items" :key="idx">
        <template #prepend>
          <v-icon>fas fa-bowl-food</v-icon>
        </template>
        <v-container class="px-0">
          <div class="text-h4 font-weight-medium mb-4">
            {{ item.name }}
          </div>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.trim="item.name"
                hide-details="auto"
                :label="$t('locales.recipe-foods.title')"
                name="special"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.trim="item.code"
                hide-details="auto"
                :label="$t('locales.recipe-foods.code')"
                name="code"
                prepend-inner-icon="fa-sharp fa-regular fa-dollar-sign"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model.trim="item.recipeWord"
                hide-details="auto"
                :label="$t('locales.recipe-foods.special')"
                name="special"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="8">
              <v-select
                v-if="data.synonymsSets"
                v-model="item.synonymsId"
                hide-details="auto"
                :hint="`${item.synonymSet?.synonyms}, ${item.synonymSet?.id}`"
                item-title="synonyms"
                item-value="id"
                :items="data.synonymsSets"
                :label="$t('locales.recipe-foods.synonymsId')"
                single-line
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="12" md="4">
              <v-btn
                block
                color="primary"
                :disabled="errors.any.value || isAppLoading || !item.id"
                :title="$t('locales.recipe-foods.steps')"
                type="button"
                @click.stop="() => openStepsDialog(item.id, item.code, item)"
              >
                <v-icon icon="fas fa-arrow-down-1-9" start />{{ $t('locales.recipe-foods.steps') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
        <template #append>
          <v-list-item-action>
            <confirm-dialog
              color="error"
              icon
              icon-left="$delete"
              :label="$t('locales.recipe-foods.remove')"
              @confirm="remove(idx)"
            >
              {{ $t('common.action.confirm.delete', { name: item.recipeWord }) }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
        <steps-dialog
          v-if="dialog && item.id === activeRecipeFoodId"
          v-bind="{
            dialog,
            activeRecipeFoodId,
            activeRecipeFoodCode,
            locale: { id, code: item.localeId },
            items: activeRecipeFood.steps,
          }"
          @close="toggleDialog"
          @update-steps="updateItemSteps(idx, item.id, $event)"
        />
      </v-list-item>
    </v-list>
  </layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { useEntry as useStoreEntry } from '@intake24/admin/stores';
import type {
  LocaleEntry,
  RecipeFoodEntry,
  RecipeFoodRequest,
  SynonymSetAttributes,
} from '@intake24/common/types/http/admin';
import { ConfirmDialog } from '@intake24/ui';

import StepsDialog from './steps-dialog.vue';

export type RecipeFoodItem = RecipeFoodRequest & Partial<{ synonymSet: RecipeFoodEntry['synonymSet']; steps: RecipeFoodEntry['steps'] }>;

export type RecipeFoodsForm = {
  items: RecipeFoodItem[];
  synonymsSets: SynonymSetAttributes[];
};
export type ChangedSynonyms = { idx: number; item: string };

export default defineComponent({
  name: 'RecipeFoods',

  components: { ConfirmDialog, StepsDialog },

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<LocaleEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors, post }, routeLeave, submit, toForm } = useEntryForm<
      RecipeFoodsForm,
      LocaleEntry
    >(props, {
      data: { items: [], synonymsSets: [] },
      config: { transform: ({ items }) => items },
    });

    const dialog = ref(false);
    const activeRecipeFoodId = ref('');
    const activeRecipeFoodCode = ref('');
    const activeRecipeFood = ref<RecipeFoodItem>({} as RecipeFoodItem);

    function dollarSignAdd(value: string) {
      if (value[0] === '$')
        return value;
      return `$${value}`;
    };

    function toggleDialog() {
      dialog.value = !dialog.value;
    };

    function openStepsDialog(
      recipeFoodId: string | undefined,
      recipeFoodCode: string,
      recipeFood: RecipeFoodRequest,
    ) {
      if (!recipeFoodId)
        return;

      activeRecipeFoodId.value = recipeFoodId;
      activeRecipeFoodCode.value = recipeFoodCode;
      activeRecipeFood.value = recipeFood;
      toggleDialog();
      console.log(recipeFoodId, recipeFoodCode, recipeFood);
    };

    function add() {
      data.value.items.push({
        localeId: props.id,
        name: '',
        code: '',
        recipeWord: '',
        synonymsId: null,
      });
    };

    function remove(index: number) {
      data.value.items.splice(index, 1);
    };

    async function updateItemSteps(idx: number, id: string, steps: RecipeFoodEntry['steps']) {
      toggleDialog();
      const item = data.value.items.find(item => item.id === id);
      if (!item)
        return;
      item.steps = steps;
      data.value.items.splice(idx, 1, item);
      useStoreEntry().setEntry({ items: data.value.items });
    };

    async function save() {
      data.value.items = data.value.items.filter(({ name }) => name).map((item) => {
        item.code = dollarSignAdd(item.code);
        return item;
      });
      const synonymsSets = data.value.synonymsSets;
      const items = await post<RecipeFoodEntry[]>(
        `admin/locales/${props.id}/recipe-foods`,
      );

      useStoreEntry().setEntry({ items, synonymsSets });
    };

    return {
      activeRecipeFoodId,
      activeRecipeFoodCode,
      activeRecipeFood,
      add,
      dialog,
      entry,
      entryLoaded,
      clearError,
      data,
      errors,
      openStepsDialog,
      remove,
      routeLeave,
      save,
      submit,
      toForm,
      toggleDialog,
      updateItemSteps,

    };
  },

  async mounted() {
    const [{ data: items }, { data: synonymsSets }] = await Promise.all([
      this.$http.get<RecipeFoodEntry[]>(`admin/locales/${this.id}/recipe-foods`),
      this.$http.get<SynonymSetAttributes[]>(`admin/locales/${this.id}/synonym-sets`),
    ]);

    this.toForm({ items, synonymsSets });
  },
});
</script>

<style lang="scss" scoped></style>
