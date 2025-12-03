<template>
  <v-divider />
  <v-list v-if="$vuetify.display.mobile" class="py-0" density="compact">
    <v-list-group>
      <template #activator="{ props }">
        <v-list-item v-bind="props" :title="$t('legal._')" />
      </template>
      <v-list-item :href="links.privacy" link target="_blank" :title="$t('legal.privacy')">
        <template #append>
          <v-list-item-action>
            <v-icon icon="$redirect" size="x-small" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-list-item :href="links.terms" link target="_blank" :title="$t('legal.terms')">
        <template #append>
          <v-list-item-action>
            <v-icon icon="$redirect" size="x-small" />
          </v-list-item-action>
        </template>
      </v-list-item>
      <cookie-consent v-slot="{ open }">
        <v-list-item href="#" link :title="$t('legal.cookies._')" @click.stop="open" />
      </cookie-consent>
      <v-list-item v-if="!loggedIn" :href="links.contact" link target="_blank" :title="$t('legal.contact')">
        <template #append>
          <v-list-item-action>
            <v-icon icon="$redirect" size="x-small" />
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list-group>
  </v-list>
  <div class="text--secondary text-caption px-4 py-2">
    <v-icon icon="fas fa-tag" size="small" start />
    {{ appInfo.build.fullVersion }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useApp } from '@intake24/ui/stores';
import { CookieConsent } from '../../cookie-consent';
import { useFooter } from './use-footer';

defineOptions({ name: 'AppNavFooter' });

defineProps({
  loggedIn: {
    type: Boolean,
  },
});

const appInfo = computed(() => useApp().app);

const { links } = useFooter();
</script>
