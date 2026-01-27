<template>
  <div>
    <v-list class="list-border">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
        @end="update"
      >
        <v-list-item
          v-for="(item, idx) in items"
          :key="item._id"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
            <v-icon
              class="mx-2 my-auto pa-4 rounded-circle"
              :style="{ backgroundColor: item.color }"
            />
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ item.color }} ({{ lastLabel && idx + 1 === items.length ? lastLabel : idx + 1 }})
          </v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn icon="$edit" :title="$t('feedback-schemes.colors.edit')" @click.stop="edit(idx, item)" />
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <v-dialog
      v-model="dialog.show"
      :fullscreen="$vuetify.display.smAndDown"
      max-width="600px"
      persistent
    >
      <v-card :tile="$vuetify.display.smAndDown">
        <v-toolbar color="secondary">
          <v-icon end icon="fas fa-palette" />
          <v-toolbar-title>
            {{ $t('feedback-schemes.colors.edit') }}
          </v-toolbar-title>
        </v-toolbar>
        <v-divider />
        <v-form ref="form" @submit.prevent="save">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item
                    v-for="[key, color] in Object.entries(colors)"
                    :key="key"
                    link
                    @click="dialog.item.color = color"
                  >
                    <template #prepend>
                      <v-icon
                        class="mx-2 my-auto pa-4 rounded-circle"
                        :style="{ backgroundColor: color }"
                      />
                    </template>
                    <v-list-item-title class="font-weight-medium text-uppercase">
                      {{ key }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <v-color-picker v-model="dialog.item.color" show-swatches />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import { defineComponent } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { useListWithDialog } from '@intake24/admin/composables';
import { colors } from '@intake24/common/theme';
import { randomString } from '@intake24/common/util';

export default defineComponent({
  name: 'ColorList',

  components: { VueDraggable },

  props: {
    lastLabel: {
      type: String,
    },
    modelValue: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },

  setup(props, context) {
    const newItem = () => ({ _id: randomString(6), color: colors.primary });
    const transformIn = (color: string) => ({ _id: randomString(6), color });
    const transformOut = ({ color }: { _id: string; color: string }) => color;

    const { dialog, form, items, edit, reset, save, update } = useListWithDialog(
      props,
      context,
      { newItem, transformIn, transformOut },
    );

    return { colors, dialog, form, items, edit, reset, save, update };
  },
});
</script>

<style lang="scss" scoped></style>
