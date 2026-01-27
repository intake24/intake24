<template>
  <v-card flat tile>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end icon="fas fa-cloud-meatball" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('feedback-schemes.cards.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn color="primary" icon="$add" size="small" :title="$t('feedback-schemes.cards.add')" @click.stop="add" />
      <options-menu>
        <select-resource resource="feedback-schemes" return-object="cards" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('feedback-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="cards" />
      </options-menu>
    </v-toolbar>
    <v-list class="list-border" lines="two">
      <vue-draggable
        v-model="cards"
        :animation="300"
        handle=".drag-and-drop__handle"
      >
        <v-list-item
          v-for="(card, index) in cards"
          :key="card.id"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title>{{ getListItemTitle(card) }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ `Type: ${card.type}` }}
          </v-list-item-subtitle>
          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                :title="$t('feedback-schemes.cards.edit')"
                @click.stop="edit({ card, index })"
              >
                <v-icon color="secondary-lighten-1">
                  $edit
                </v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('feedback-schemes.cards.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: getListItemTitle(card) }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <card-selector ref="selector" :images="images" @save="save" />
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Card } from '@intake24/common/feedback';
import type { FeedbackImage, NutrientTypeResponse } from '@intake24/common/types/http/admin';

import { useVModel } from '@vueuse/core';
import { useTemplateRef } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { copy } from '@intake24/common/util';
import { ConfirmDialog } from '@intake24/ui';

import CardSelector from './card-selector.vue';

type CardEvent = {
  index: number;
  card: Card;
};

defineOptions({ name: 'CardList' });

const props = defineProps({
  images: {
    type: Array as PropType<FeedbackImage[]>,
    default: () => [],
  },
  nutrientTypes: {
    type: Array as PropType<NutrientTypeResponse[]>,
    default: () => [],
  },
  modelValue: {
    type: Array as PropType<Card[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const cards = useVModel(props, 'modelValue', emit, { deep: true, passive: true, clone: copy });
const selector = useTemplateRef('selector');

function getListItemTitle(card: Card): string {
  const { image } = card;

  if (!('nutrientTypeIds' in card))
    return image;

  const nutrients = props.nutrientTypes
    .filter(({ id }) => card.nutrientTypeIds.includes(id))
    .map(item => item.description);

  return `${image} | ${nutrients.join(' | ')}`;
};

function add() {
  selector.value?.add();
};

function load(items: Card[]) {
  cards.value = [...items];
};

function edit({ card, index }: CardEvent) {
  selector.value?.edit(index, card);
};

function save({ card, index }: CardEvent) {
  if (index === -1)
    cards.value.push(card);
  else cards.value.splice(index, 1, card);
};

function remove(index: number) {
  cards.value.splice(index, 1);
};
</script>
