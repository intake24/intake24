import type { RouteRecordRaw } from 'vue-router';

import { createRouter, createWebHistory } from 'vue-router';

import {
  authGuard,
  createUserGuard,
  feedbackParametersGuard,
  globalGuard,
  surveyParametersErrorGuard,
  surveyParametersGuard,
} from './guards';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/home.vue'),
    meta: { module: 'login', title: 'common._' },
  },
  {
    path: '/a/:token',
    name: 'authentication',
    meta: { module: 'login', title: 'common.login._' },
    component: () => import('../views/survey/login.vue'),
    beforeEnter: authGuard,
  },
  {
    path: '/:surveyId',
    name: 'survey-login',
    component: () => import('../views/survey/login.vue'),
    meta: { module: 'login', title: 'common.login._' },
    props: true,
  },
  {
    path: '/:surveyId/challenge',
    name: 'survey-challenge',
    component: () => import('../views/survey/challenge.vue'),
    meta: { module: 'login', title: 'common.login._' },
    props: true,
  },
  {
    path: '/:surveyId/generate-user',
    name: 'survey-generate-user',
    component: () => import('../views/survey/generate-user.vue'),
    meta: { module: 'public', title: 'common.login._' },
    props: true,
  },
  {
    path: '/:surveyId/create-user/:token',
    name: 'survey-create-user',
    component: () => import('../views/survey/login.vue'),
    meta: { module: 'public' },
    beforeEnter: createUserGuard,
  },
  {
    path: '/:surveyId/home',
    name: 'survey-home',
    component: () => import('../views/survey/home.vue'),
    meta: { module: 'survey', title: 'recall._' },
    beforeEnter: surveyParametersGuard,
    props: true,
  },
  {
    path: '/:surveyId/profile',
    name: 'survey-profile',
    component: () => import('../views/survey/profile.vue'),
    meta: { module: 'survey', title: 'profile._' },
    beforeEnter: surveyParametersGuard,
    props: true,
  },
  {
    path: '/:surveyId/recall',
    name: 'survey-recall',
    component: () => import('../views/survey/recall.vue'),
    meta: { module: 'survey', title: 'recall._' },
    beforeEnter: surveyParametersGuard,
    props: true,
  },
  {
    path: '/:surveyId/error',
    name: 'survey-error',
    component: () => import('../views/survey/error.vue'),
    meta: { module: 'survey', title: 'recall._' },
    beforeEnter: surveyParametersErrorGuard,
    props: true,
  },
  // Feedback
  {
    path: '/:surveyId/feedback',
    name: 'feedback-home',
    component: () => import('../views/feedback/home.vue'),
    meta: { module: 'feedback', title: 'feedback._' },
    beforeEnter: feedbackParametersGuard,
    props: true,
  },
  {
    path: '/:surveyId/feedback/error',
    name: 'feedback-error',
    component: () => import('../views/survey/home.vue'),
    meta: { module: 'feedback', title: 'feedback._' },
    beforeEnter: surveyParametersErrorGuard,
    props: true,
  },
  {
    path: '/:surveyId/feedback/physical-data',
    name: 'feedback-physical-data',
    component: () => import('../views/feedback/physical-data.vue'),
    meta: { module: 'feedback', title: 'feedback._' },
    beforeEnter: feedbackParametersGuard,
    props: true,
  },
  // Catch any unmatched routes
  {
    path: '/:catchAll(.*)',
    name: '404',
    redirect: { name: 'home' },
  },
];
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_BASE_URL ?? '/'),
  routes,
});

router.beforeEach(globalGuard);

export default router;
