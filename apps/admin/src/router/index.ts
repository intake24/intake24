import type { RouteRecordRaw } from 'vue-router';
import type { Resource } from '../types';
import { singular } from 'pluralize';

import { createRouter, createWebHistory } from 'vue-router';

import views from '@intake24/admin/views';
import resources from './resources';

export interface GenerateRoutesOps extends Resource {
  parent?: string;
}

function isVueComponent(object: any) {
  if (typeof object === 'function')
    return true;

  const { render, setup } = object;
  if (setup && typeof setup === 'function')
    return true;
  if (render && typeof render === 'function')
    return true;

  return false;
}

function generateResourceRoutes(resourceName: string, pathSegments: string[], viewsPath: any, options: GenerateRoutesOps) {
  const { parent, securable } = options;
  const routerRoutes: RouteRecordRaw[] = [];

  const resourceRoutes = Object.keys(viewsPath);
  const name = parent ? `${parent}-${resourceName}` : resourceName;
  const title
    = parent && !['media', 'securables'].includes(resourceName) ? `${parent}.${resourceName}` : resourceName;
  const identifier = parent ? `${singular(resourceName)}Id` : 'id';

  const meta = { module: { current: resourceName, parent } };

  resourceRoutes.forEach((action) => {
    let perm = parent ? `${parent}:${resourceName}` : `${resourceName}:${action}`;
    if (securable)
      perm = options.name;

    if (action === 'browse') {
      routerRoutes.push({
        path: pathSegments.join('/'),
        name,
        component: viewsPath[action],
        meta: { ...meta, action, title: `${title}.title`, perm },
        props: true,
      });
      return;
    }

    if (action === 'create') {
      routerRoutes.push({
        path: [...pathSegments, action].join('/'),
        name: `${name}-${action}`,
        component: viewsPath[action],
        meta: { ...meta, action, title: `${title}.${action}`, perm: `${name}:create` },
        props: true,
      });
      return;
    }

    if (isVueComponent(viewsPath[action])) {
      routerRoutes.push({
        path: [...pathSegments, `:${identifier}`, action === 'read' ? undefined : action]
          .filter(Boolean)
          .join('/'),
        name: `${name}-${action}`,
        component: viewsPath[action],
        meta: { ...meta, action, title: `${title}.${action}`, perm },
        props: true,
      });
      return;
    }

    if (typeof viewsPath[action] === 'object') {
      routerRoutes.push(
        ...generateResourceRoutes(action, [...pathSegments, ':id', action], viewsPath[action], {
          ...options,
          parent: name,
        }),
      );
    }
  });

  return routerRoutes;
}

const { authentication } = views;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'login',
    component: authentication.login,
    meta: { module: { current: 'login' }, public: true, title: 'common.login._' },
  },
  {
    path: '/password',
    name: 'password-request',
    component: authentication.passwordRequest,
    meta: { module: { current: 'password' }, public: true, title: 'common.password.reset._' },
  },
  {
    path: '/password/reset/:token',
    name: 'password-reset',
    component: authentication.passwordReset,
    meta: { module: { current: 'password' }, public: true, title: 'common.password.reset._' },
  },
  {
    path: '/verify',
    name: 'verify',
    component: authentication.verify,
    meta: { module: { current: 'verify' }, public: true, title: 'common.login._' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: views.dashboard,
    meta: { module: { current: 'dashboard' }, action: 'browse', title: 'dashboard._' },
  },
  {
    path: '/import',
    name: 'import',
    component: views.importPackage,
    meta: { module: { current: 'import' }, title: 'io.import' },
  },
  {
    path: '/user',
    name: 'user',
    component: views.user.profile,
    meta: { module: { current: 'user' }, title: 'user.profile' },
  },
  {
    path: '/user/jobs',
    name: 'user.jobs',
    component: views.user.jobs.browse,
    meta: { module: { current: 'user.jobs' }, title: 'user.jobs._' },
  },
  {
    path: '/user/jobs/create',
    name: 'user.jobs-create',
    component: views.user.jobs.create,
    meta: { module: { current: 'user.jobs' }, title: 'user.jobs._' },
    props: true,
  },
  {
    path: '/user/jobs/:id',
    name: 'user.jobs-read',
    component: views.user.jobs.read,
    meta: { module: { current: 'user.jobs' }, title: 'user.jobs._' },
    props: true,
  },
  {
    path: '/user/personal-access-tokens',
    name: 'user.personal-access-tokens',
    component: views.user.personalAccessTokens.browse,
    meta: { module: { current: 'user.personal-access-tokens' }, title: 'user.personalAccessTokens._' },
  },
  // Food databases explorer
  {
    path: '/fdbs',
    name: 'fdbs',
    component: views.fdbs.browse,
    meta: {
      module: { current: 'fdbs' },
      title: 'fdbs.title',
      action: 'browse',
      perm: 'locales',
    },
  },
  {
    path: '/fdbs/:id',
    name: 'fdbs-food-list',
    component: views.fdbs.read,
    meta: {
      module: { current: 'fdbs' },
      title: 'fdbs.food-list.title',
      action: 'food-list',
      perm: 'locales',
    },
    props: true,
    children: [
      {
        path: 'categories/:entryId',
        name: 'fdbs-categories',
        component: views.fdbs.category,
        meta: {
          module: { current: 'categories', parent: 'fdbs' },
          title: 'fdbs.food-list.title',
          action: 'food-list',
          perm: 'locales',
        },
        props: true,
      },
      {
        path: 'foods/:entryId',
        name: 'fdbs-foods',
        component: views.fdbs.food,
        meta: {
          module: { current: 'foods', parent: 'fdbs' },
          title: 'fdbs.food-list.title',
          action: 'food-list',
          perm: 'locales',
        },
        props: true,
      },
    ],
  },
];

if (import.meta.env.VITE_ACL_SIGNUP_ENABLED === 'true') {
  routes.push({
    path: '/signup',
    name: 'signup',
    component: authentication.signup,
    meta: { module: { current: 'signup' }, public: true, title: 'common.signup._' },
  });
}

resources.forEach((item) => {
  const { name, path = name, generateRoutes } = item;
  if (!generateRoutes)
    return;

  const pathSegments = path.split('/');
  const resourceViews = pathSegments.reduce((acc, seg) => acc[seg], views);

  const [first, ...rest] = pathSegments;
  routes.push(...generateResourceRoutes(name, [`/${first}`, ...rest], resourceViews, item));
});

routes.push({
  path: '/:catchAll(.*)',
  name: '404',
  redirect: { name: 'login' },
});

export default createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_BASE_URL ?? '/'),
  routes,
});
