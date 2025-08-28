<template>
  <div>
    <v-tabs-window-item value="options">
      <v-row class="mb-3">
        <v-col cols="12" md="6">
          <v-card border flat>
            <v-toolbar color="grey-lighten-4">
              <v-toolbar-title class="font-weight-medium">
                {{ $t('survey-schemes.prompts.linkedQuantity.title') }}
              </v-toolbar-title>
            </v-toolbar>
            <v-card-subtitle>
              {{ $t('survey-schemes.prompts.linkedQuantity.subtitle') }}
            </v-card-subtitle>
            <v-card-text>
              <v-switch
                hide-details="auto"
                :label="$t('survey-schemes.prompts.linkedQuantity.auto')"
                :model-value="linkedQuantity.auto"
                @update:model-value="update('linkedQuantity', { ...linkedQuantity, auto: $event })"
              />
            </v-card-text>
            <category-list
              class="mb-6"
              flat
              :model-value="linkedQuantity.source.map((code) => ({ code, name: code }))"
              tile
              @update:model-value="updateLQSource"
            >
              <template #title>
                {{ $t('survey-schemes.prompts.linkedQuantity.source') }}
              </template>
              <template #[`item.content`]="{ item }">
                <v-list-item-title>
                  {{ $t('fdbs.categories._') }}: {{ item.code }}
                </v-list-item-title>
              </template>
            </category-list>
            <category-list
              flat
              :model-value="linkedQuantity.parent.map((item) => ({ name: item.code, ...item }))"
              tile
              @update:model-value="updateLQParent"
            >
              <template #title>
                {{ $t('survey-schemes.prompts.linkedQuantity.parent') }}
              </template>
              <template #[`item.content`]="{ item }">
                <v-list-item-title>
                  {{ $t('fdbs.categories._') }}: {{ item.code }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ $t('standard-units._') }}: {{ item.unit ?? $t('common.not.assigned') }}
                </v-list-item-subtitle>
              </template>
              <template #[`item.action`]="{ item }">
                <select-resource
                  item-name="id"
                  resource="standard-units"
                  @update:model-value="updateLQUnit(item.code, $event)"
                >
                  <template #activator="{ props }">
                    <v-btn icon="$standard-units" v-bind="props" :title="$t('standard-units.add')" />
                  </template>
                </select-resource>
              </template>
            </category-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <image-map-settings
            :model-value="imageMap"
            @update:model-value="update('imageMap', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-switch
            hide-details="auto"
            :label="$t('survey-schemes.prompts.badges')"
            :model-value="badges"
            @update:model-value="update('badges', $event)"
          />
        </v-col>
      </v-row>
    </v-tabs-window-item>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { SelectResource } from '@intake24/admin/components/dialogs';
import { CategoryList } from '@intake24/admin/components/fdbs';
import type { Prompts } from '@intake24/common/prompts';
import type { CategoryReference } from '@intake24/common/types/http/admin';
import { copy } from '@intake24/common/util';
import { basePrompt, ImageMapSettings } from '../partials';

export default defineComponent({
  name: 'GuideImagePrompt',

  components: { CategoryList, ImageMapSettings, SelectResource },

  mixins: [basePrompt],

  props: {
    badges: {
      type: Boolean as PropType<Prompts['guide-image-prompt']['badges']>,
      required: true,
    },
    imageMap: {
      type: Object as PropType<Prompts['guide-image-prompt']['imageMap']>,
      required: true,
    },
    linkedQuantity: {
      type: Object as PropType<Prompts['guide-image-prompt']['linkedQuantity']>,
      required: true,
    },
  },

  methods: {
    updateLQParent(items: CategoryReference[]) {
      const linkedQuantity = {
        ...this.linkedQuantity,
        parent: items.map(({ name }) => ({ code: name })),
      };
      this.update('linkedQuantity', linkedQuantity);
    },

    updateLQSource(items: CategoryReference[]) {
      const linkedQuantity = {
        ...this.linkedQuantity,
        source: items.map(({ code }) => code),
      };
      this.update('linkedQuantity', linkedQuantity);
    },

    updateLQUnit(code: string, unit: string) {
      const parent = copy(this.linkedQuantity.parent);
      const idx = this.linkedQuantity.parent.findIndex(cat => cat.code === code);
      parent.splice(idx, 1, { code, unit });

      const linkedQuantity = { ...this.linkedQuantity, parent };

      this.update('linkedQuantity', linkedQuantity);
    },
  },
});
</script>

<style lang="scss" scoped></style>
