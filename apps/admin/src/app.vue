<template>
  <v-app>
    <loader :show="isAppLoading" />
    <v-navigation-drawer v-if="loggedIn" v-model="sidebar" color="background">
      <v-list>
        <v-list-item link to="/">
          <template #prepend>
            <v-avatar :image="logo" rounded="0" variant="text" />
          </template>
          <v-list-item-title class="my-1 text-title-medium">
            {{ app.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <v-list color="primary" density="compact" nav>
        <v-list-group prepend-icon="fas fa-user" :value="true">
          <template #activator="{ props }">
            <v-list-item v-bind="props" :title="$t('user._')" />
          </template>
          <v-list-item link prepend-icon="fas fa-tachometer-alt" :to="{ name: 'dashboard' }">
            <v-list-item-title>{{ $t('dashboard._') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="isVerified"
            link
            prepend-icon="fas fa-circle-user"
            :to="{ name: 'user' }"
          >
            <v-list-item-title>{{ $t('user.profile') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="isAalSatisfied && isVerified"
            link
            prepend-icon="fas fa-key"
            :to="{ name: 'user.personal-access-tokens' }"
          >
            <v-list-item-title>{{ $t('user.personalAccessTokens.title') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="isAalSatisfied && isVerified"
            link
            prepend-icon="$jobs"
            :to="{ name: 'user.jobs' }"
          >
            <v-list-item-title>{{ $t('user.jobs.title') }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list>
      <menu-tree
        v-if="
          can([
            'locales',
            'nutrient-tables:browse',
            'nutrient-types:browse',
            'nutrient-units:browse',
            'packages:import',
            'packages:export',
          ])
        "
        icon="fas fa-fw fa-hamburger"
        name="fdb"
        :resources="resources.fdb"
      />
      <menu-tree
        v-if="can(['languages', 'locales'])"
        icon="fas fa-fw fa-globe"
        name="local"
        :resources="resources.local"
      />
      <menu-tree
        v-if="can(['as-served:browse', 'guide-images:browse', 'image-maps:browse'])"
        icon="fas fa-fw fa-images"
        name="images"
        :resources="resources.images"
      />
      <menu-tree
        v-if="
          can(['feedback-schemes', 'survey-schemes', 'survey-scheme-prompts:browse', 'surveys'])
        "
        icon="fas fa-fw fa-tools"
        name="surveyMgmt"
        :resources="resources.surveyMgmt"
      />
      <menu-tree
        v-if="can('acl')"
        icon="fas fa-fw fa-low-vision"
        name="acl"
        :resources="resources.acl"
      />
      <menu-tree
        v-if="can(['jobs:browse', 'sign-in-logs:browse', 'tasks:browse'])"
        icon="fas fa-fw fa-tools"
        name="system"
        :resources="resources.system"
      />
      <template #append>
        <app-nav-footer />
      </template>
    </v-navigation-drawer>

    <v-app-bar v-if="loggedIn" color="background" flat>
      <v-app-bar-nav-icon @click.stop="toggleSidebar" />
      <v-spacer />
      <v-btn :href="app.docs" target="_blank" :title="$t('common.docs')" variant="text">
        <v-icon icon="$docs" :start="!$vuetify.display.mobile" />
        <span class="d-none d-sm-block">{{ $t('common.docs') }}</span>
      </v-btn>
      <v-btn v-if="isVerified" :to="{ name: 'user' }" variant="text">
        <v-icon icon="$user" :start="!$vuetify.display.mobile" />
        <span class="d-none d-sm-block">{{ $t('user.profile') }}</span>
      </v-btn>
      <v-divider class="mx-2" inset vertical />
      <v-btn
        :icon="theme.name.value === 'dark' ? 'far fa-moon' : 'far fa-sun'"
        size="small"
        variant="text"
        @click="theme.cycle()"
      />
      <v-divider class="mx-2" inset vertical />
      <confirm-dialog :label="$t('common.logout._')" @confirm="logout">
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props">
            <span class="d-none d-sm-block">{{ $t('common.logout._') }}</span>
            <v-icon :end="!$vuetify.display.mobile" icon="$logout" />
          </v-btn>
        </template>
        {{ $t('common.logout.text') }}
      </confirm-dialog>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
    <service-worker />
    <message-box />
    <app-footer :logged-in />
  </v-app>
</template>

<script lang="ts" setup>
import { groupBy } from 'lodash-es';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay, useLocale, useTheme } from 'vuetify';

import MenuTree from '@intake24/admin/components/sidebar/menu-tree.vue';
import { useWebPush } from '@intake24/admin/components/web-push';
import defaultResources from '@intake24/admin/router/resources';
import { useApp, useAuth, useEntry, useResource, useUser } from '@intake24/admin/stores';
import { iconPrimary as logo } from '@intake24/common/theme/assets';
import { AppFooter, AppNavFooter, ConfirmDialog, Loader, MessageBox, ServiceWorker, useI18n, useLanguage } from '@intake24/ui';

import { useHttp } from './services';

const theme = useTheme();
const http = useHttp();
const vI18n = useLocale();
const display = useDisplay();
const entry = useEntry();
const auth = useAuth();
const resource = useResource();
const route = useRoute();
const router = useRouter();
const user = useUser();
const webPush = useWebPush();
const { i18n: { t } } = useI18n();

useLanguage('admin', http, vI18n);

const sidebar = ref(display.lgAndUp);
const resources = groupBy(defaultResources, 'group');

const app = computed(() => useApp().app);
const { loggedIn } = storeToRefs(auth);
const { isAalSatisfied, isVerified } = storeToRefs(user);

const title = computed(() => {
  const { meta: { title } = {} } = route;
  if (title)
    return t(title);

  if (!resource.name)
    return t('common._');

  const { id, name, englishName, description } = entry.data;

  // TODO: we should resole breadcrumb name in better way based on entry field
  return name ?? englishName ?? description ?? id ?? t(`${resource.name}.title`);
});

function toggleSidebar() {
  sidebar.value = !sidebar.value;
};

async function logout() {
  await auth.logout(true);
  await router.push({ name: 'login' });
};

watch(title, (val) => {
  document.title = val;
});

onMounted(async () => {
  if (!loggedIn.value && route.name === 'login') {
    const { state, code } = route.query;

    // MFA verification -> do not refresh yet
    if ([state, code].every(item => typeof item === 'string' && item.length))
      return;

    await auth.refresh();
    await router.push({ name: 'dashboard' });
  }

  if (!loggedIn.value)
    return;

  // Send subscription to server to keep it up-to-date
  setTimeout(async () => {
    if (webPush.isPermissionGranted.value)
      await webPush.subscribe();
  }, 5 * 1000);
});
</script>

<style lang="scss">
@use '@intake24/admin/scss/app.scss';
</style>
