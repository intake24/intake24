<template>
  <v-app>
    <loader :show="isAppLoading" />
    <v-navigation-drawer v-if="loggedIn && isVerified" v-model="sidebar" color="secondary">
      <v-list>
        <v-list-item link to="/">
          <template #prepend>
            <v-avatar :image="logo" rounded="0" />
          </template>
          <v-list-item-title class="my-1 text-h6">
            {{ app.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list density="compact" nav>
        <v-list-group color="grey-lighten-1" prepend-icon="fas fa-user" :value="true">
          <template #activator="{ props }">
            <v-list-item v-bind="props">
              <v-list-item-title>{{ $t('user._') }}</v-list-item-title>
            </v-list-item>
          </template>
          <v-list-item link prepend-icon="fas fa-tachometer-alt" :to="{ name: 'dashboard' }">
            <v-list-item-title>{{ $t('dashboard._') }}</v-list-item-title>
          </v-list-item>
          <v-list-item link prepend-icon="fas fa-circle-user" :to="{ name: 'user' }">
            <v-list-item-title>{{ $t('user.profile') }}</v-list-item-title>
          </v-list-item>
          <v-list-item link prepend-icon="fas fa-key" :to="{ name: 'user.personal-access-tokens' }">
            <v-list-item-title>{{ $t('user.personalAccessTokens.title') }}</v-list-item-title>
          </v-list-item>
          <v-list-item link prepend-icon="$jobs" :to="{ name: 'user.jobs' }">
            <v-list-item-title>{{ $t('user.jobs.title') }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list>
      <menu-tree
        v-if="
          can([
            'locales',
            'food-groups:browse',
            'nutrient-tables:browse',
            'nutrient-types:browse',
            'nutrient-units:browse',
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

    <v-app-bar v-if="loggedIn" color="primary">
      <v-app-bar-nav-icon :disabled="!isVerified" @click.stop="toggleSidebar" />
      <v-spacer />
      <v-btn :href="app.docs" target="_blank" :title="$t('common.docs')" variant="text">
        <v-icon :start="!$vuetify.display.mobile">
          $docs
        </v-icon>
        <span class="d-none d-sm-block">{{ $t('common.docs') }}</span>
      </v-btn>
      <v-btn v-if="isVerified" :to="{ name: 'user' }" variant="text">
        <v-icon :start="!$vuetify.display.mobile">
          $user
        </v-icon>
        <span class="d-none d-sm-block">{{ $t('user.profile') }}</span>
      </v-btn>
      <v-divider class="mx-2" vertical />
      <confirm-dialog :label="$t('common.logout._')" @confirm="logout">
        <template #activator="{ props }">
          <v-btn variant="text" v-bind="props">
            <span class="d-none d-sm-block">{{ $t('common.logout._') }}</span>
            <v-icon :end="!$vuetify.display.mobile">
              $logout
            </v-icon>
          </v-btn>
        </template>
        {{ $t('common.logout.text') }}
      </confirm-dialog>
    </v-app-bar>
    <v-main>
      <v-container :class="{ 'pa-0': $vuetify.display.mobile }" fluid>
        <v-breadcrumbs v-if="breadcrumbs.length" class="px-1 py-2" :items="breadcrumbs">
          <template #divider>
            <v-icon>fas fa-caret-right</v-icon>
          </template>
        </v-breadcrumbs>
        <router-view />
      </v-container>
    </v-main>
    <service-worker />
    <message-box />
    <app-footer />
  </v-app>
</template>

<script lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import groupBy from 'lodash/groupBy';
import { mapState } from 'pinia';
import pluralize from 'pluralize';
import { computed, defineComponent, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay, useLocale } from 'vuetify';

import MenuTree from '@intake24/admin/components/sidebar/menu-tree.vue';
import webPush from '@intake24/admin/components/web-push/web-push';
import resources from '@intake24/admin/router/resources';
import { useApp, useAuth, useEntry, useResource, useUser } from '@intake24/admin/stores';
import { iconWhite } from '@intake24/common/theme/assets';
import type { Dictionary } from '@intake24/common/types';
import { useI18n } from '@intake24/i18n';

import { AppFooter, AppNavFooter, ConfirmDialog, Loader, MessageBox, ServiceWorker, useLanguage } from '@intake24/ui';
import { useHttp } from './services';

type Breadcrumbs = {
  disabled?: boolean;
  exact?: boolean;
  href?: string;
  link?: boolean;
  title: string;
  to?: string | RouteLocationRaw;
};

export default defineComponent({
  name: 'App',

  components: { AppFooter, AppNavFooter, ConfirmDialog, Loader, MenuTree, MessageBox, ServiceWorker },

  mixins: [webPush],

  setup() {
    const http = useHttp();
    const vI18n = useLocale();
    const display = useDisplay();
    const entry = useEntry();
    const resource = useResource();
    const route = useRoute();
    const router = useRouter();
    const { i18n: { t } } = useI18n();

    useLanguage('admin', http, vI18n);

    const sidebar = ref(display.lgAndUp);

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

    function buildBreadCrumb(module: string, action: string, currentParams: Dictionary, parent?: string) {
      const defaults = { disabled: false, exact: true, link: true };
      const items: Breadcrumbs[] = [];

      if (parent) {
        items.push(
          ...buildBreadCrumb(parent, parent === 'fdbs' ? action : 'read', currentParams),
        );
      }

      const name = parent ? `${parent}-${module}` : module;
      const title = parent && !['media', 'securables'].includes(module) ? `${parent}.${module}` : module;
      const identifier = parent ? `${pluralize.singular(module)}Id` : 'id';
      const { [identifier]: currentId, id } = currentParams;

      const params: Dictionary<string> = { [identifier]: currentId };
      if (parent)
        params.id = id;

      items.push({ ...defaults, title: t(`${title}.title`), to: { name } });

      if (!currentId)
        return items;

      if (currentId === 'create') {
        items.push({
          ...defaults,
          title: t(`${title}.${action}`),
          to: { name: `${name}-${action}`, params },
        });
        return items;
      }

      // TODO: we should resole breadcrumb name in better way based on entry field
      const { id: entryId, name: entryName, englishName, description } = entry.data;
      const text = entryName ?? englishName ?? description ?? entryId ?? t(`${title}.read`);

      items.push({
        ...defaults,
        title: parent ? t(`${title}.${action}`) : text,
        to: { name: `${name}-${action === 'edit' ? 'read' : action}`, params },
      });

      if (['edit'].includes(action)) {
        items.push({
          ...defaults,
          title: t(`${title}.${action}`),
          to: { name: `${name}-${action}`, params },
        });
      }

      return items;
    };

    const breadcrumbs = computed(() => {
      const { meta: { module, action } = {}, params } = route;
      if (!module || !action)
        return [];

      const { current, parent } = module;
      return buildBreadCrumb(current, action, params, parent);
    });

    function toggleSidebar() {
      sidebar.value = !sidebar.value;
    };

    async function logout() {
      await useAuth().logout(true);
      await router.push({ name: 'login' });
    };

    watch(title, (val) => {
      document.title = val;
    });

    return {
      breadcrumbs,
      logo: iconWhite,
      logout,
      resources: groupBy(resources, 'group'),
      sidebar,
      title,
      toggleSidebar,
    };
  },

  computed: {
    ...mapState(useApp, ['app']),
    ...mapState(useAuth, ['loggedIn']),
    ...mapState(useUser, ['isVerified']),
  },

  async mounted() {
    if (!this.loggedIn && this.$route.name === 'login') {
      const { state, code } = this.$route.query;

      // MFA verification -> do not refresh yet
      if ([state, code].every(item => typeof item === 'string' && item.length))
        return;

      await useAuth().refresh();
      await this.$router.push({ name: this.isVerified ? 'dashboard' : 'verify' });
    }

    if (!this.loggedIn)
      return;

    // Send subscription to server to keep it up-to-date
    setTimeout(async () => {
      if (this.isPermissionGranted)
        await this.subscribe();
    }, 5 * 1000);
  },
});
</script>

<style lang="scss">
@use '@intake24/admin/scss/app.scss';
</style>
