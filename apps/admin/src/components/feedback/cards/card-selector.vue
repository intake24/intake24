<template>
  <v-dialog
    v-model="dialog.show"
    fullscreen
    persistent
    :retain-focus="false"
    :scrim="false"
    transition="dialog-bottom-transition"
    :z-index="1050"
  >
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
        <v-toolbar-title>
          {{ $t(`feedback-schemes.cards.${dialog.index === -1 ? 'add' : 'edit'}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
            <v-icon icon="$success" start />{{ $t('common.action.ok') }}
          </v-btn>
        </v-toolbar-items>
        <template #extension>
          <v-container>
            <v-tabs v-model="tab" bg-color="secondary">
              <v-tab
                v-for="item in cardSettings[dialog.card.type].tabs" :key="item"
                :value="item"
              >
                {{ $t(`feedback-schemes.cards.tabs.${item}`) }}
              </v-tab>
            </v-tabs>
          </v-container>
        </template>
      </v-toolbar>
      <v-form ref="form" @submit.prevent="save">
        <v-container>
          <v-tabs-window v-model="tab" class="pt-1">
            <v-tabs-window-item value="general">
              <v-container>
                <v-row>
                  <v-col cols="12">
                    <v-card border flat>
                      <v-toolbar color="grey-lighten-4">
                        <v-icon end icon="fas fa-cloud-meatball" />
                        <v-toolbar-title>
                          {{ $t(`feedback-schemes.cards.type`) }}
                        </v-toolbar-title>
                      </v-toolbar>
                      <v-item-group
                        v-model="dialog.card.type"
                        selected-class="primary"
                        @update:model-value="updateCardProps"
                      >
                        <v-container>
                          <v-row>
                            <v-col v-for="card in cardDefaults" :key="card.type" cols="12" md="3">
                              <v-item v-slot="{ isSelected, toggle }" :value="card.type">
                                <v-card
                                  :color="isSelected ? 'primary' : 'secondary'"
                                  dark
                                  height="180"
                                  @click.stop="toggle"
                                >
                                  <v-card-title class="text-center">
                                    {{ $t(`feedback-schemes.cards.${card.type}.title`) }}
                                  </v-card-title>
                                  <v-card-subtitle class="text-center">
                                    {{ $t(`feedback-schemes.cards.${card.type}.subtitle`) }}
                                  </v-card-subtitle>
                                  <v-card-text v-show="isSelected" class="text-center">
                                    <v-icon size="48">
                                      $check
                                    </v-icon>
                                  </v-card-text>
                                </v-card>
                              </v-item>
                            </v-col>
                          </v-row>
                        </v-container>
                      </v-item-group>
                    </v-card>
                  </v-col>
                  <v-col cols="12">
                    <v-card border flat>
                      <v-toolbar color="grey-lighten-4">
                        <v-icon end icon="fas fa-gears" />
                        <v-toolbar-title>
                          {{ $t(`feedback-schemes.cards.options`) }}
                        </v-toolbar-title>
                      </v-toolbar>
                      <v-card-text>
                        <v-container>
                          <v-row>
                            <v-col cols="12" md="6">
                              <v-select
                                v-model="dialog.card.image"
                                hide-details="auto"
                                item-title="id"
                                item-value="id"
                                :items="images"
                                :label="$t('feedback-schemes.cards.image')"
                                name="image"
                                variant="outlined"
                              >
                                <template #item="{ item, props }">
                                  <v-list-item v-bind="props" :title="item.raw.id">
                                    <template #prepend>
                                      <v-avatar class="mr-4 my-2" tile>
                                        <v-img :alt="item.raw.id" :src="item.raw.url" />
                                      </v-avatar>
                                    </template>
                                  </v-list-item>
                                </template>
                              </v-select>
                            </v-col>
                            <v-col cols="12" md="6">
                              <v-expansion-panels>
                                <v-expansion-panel key="color">
                                  <v-expansion-panel-title>
                                    {{ $t(`feedback-schemes.cards.color`) }}
                                  </v-expansion-panel-title>
                                  <v-expansion-panel-text>
                                    <v-color-picker
                                      v-model="dialog.card.color"
                                      show-swatches
                                    />
                                  </v-expansion-panel-text>
                                </v-expansion-panel>
                              </v-expansion-panels>
                            </v-col>

                            <v-col cols="12" md="6">
                              <v-switch
                                v-model="dialog.card.showRecommendations"
                                hide-details="auto"
                                :label="$t('feedback-schemes.cards.showRecommendations')"
                              />
                            </v-col>
                          </v-row>
                        </v-container>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-tabs-window-item>
            <component :is="dialog.card.type" v-model="dialog.card" />
          </v-tabs-window>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { VForm } from 'vuetify/components';

import type { RuleCallback } from '@intake24/admin/types';
import type { Card } from '@intake24/common/feedback';
import type { FeedbackImage } from '@intake24/common/types/http/admin';

import { defineComponent, useTemplateRef } from 'vue';

import { useTinymce } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { cardDefaults } from '@intake24/common/feedback';
import { copy, merge, randomString } from '@intake24/common/util';

import { cardSettings } from './card';
import cardTypes from './card-types';

type CardDialog = {
  show: boolean;
  index: number;
  card: Card;
};

export default defineComponent({
  name: 'CardSelector',

  components: { LanguageSelector, ...cardTypes },

  props: {
    images: {
      type: Array as PropType<FeedbackImage[]>,
      default: () => [],
    },
    textRequired: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['save'],

  setup() {
    useTinymce();
    const form = useTemplateRef<InstanceType<typeof VForm>>('form');

    return { form };
  },

  data() {
    const dialog = (show = false): CardDialog => ({
      show,
      index: -1,
      card: copy({ ...cardDefaults[0], id: randomString(6) }),
    });

    return {
      dialog: dialog(),
      newDialog: dialog,
      cardDefaults,
      cardSettings,
      tab: 'general',
    };
  },

  computed: {
    textRules(): RuleCallback[] {
      return this.textRequired
        ? [(value: string | null): boolean | string => !!value || 'Card name is required.']
        : [];
    },
  },

  methods: {
    updateCardProps() {
      const {
        show,
        index,
        card: { type },
      } = this.dialog;

      const card = this.cardDefaults.find(item => item.type === type);
      if (!card)
        return;

      this.dialog = { show, index, card: copy({ ...card, id: randomString(6) }) };
    },

    add() {
      this.dialog = this.newDialog(true);
    },

    edit(index: number, card: Card) {
      const defaults = this.cardDefaults.find(c => c.type === card.type);
      if (!defaults) {
        console.warn(`Card defaults for card type '${card.type}' not found.`);
        return;
      }

      this.dialog = {
        show: true,
        index,
        card: copy(merge<Card>(defaults, card)),
      };
    },

    async save() {
      const isValid = await this.form?.validate() ?? {};
      if (!isValid)
        return;

      const { index, card } = this.dialog;

      this.$emit('save', { card, index });

      this.reset();
    },

    reset() {
      this.tab = 'general';
      this.dialog = this.newDialog();
      this.form?.resetValidation();
    },

    validate() {
      this.form?.validate();
    },
  },
});
</script>
