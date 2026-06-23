import type { RouteLocationRaw } from 'vue-router';

import type { Dictionary } from '@intake24/common/types';

import pluralize from 'pluralize';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useI18n } from '@intake24/ui';

import { useEntry } from '../stores';

type Breadcrumbs = {
  disabled?: boolean;
  exact?: boolean;
  href?: string;
  link?: boolean;
  title: string;
  to?: string | RouteLocationRaw;
};

export function useBreadcrumbs() {
  const route = useRoute();
  const { i18n: { t } } = useI18n();
  const entry = useEntry();

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

  return {
    breadcrumbs,
  };
}
