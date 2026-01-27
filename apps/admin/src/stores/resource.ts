import type { Resource } from '../types';
import type { Dictionary } from '@intake24/common/types';

import { defineStore } from 'pinia';

export type ListState = {
  name: string;
  module?: string;
  api: string;
  refs: boolean;
  filter: Dictionary;
};

export const useResource = defineStore('resource', {
  state: (): ListState => ({
    name: 'dashboard',
    module: undefined,
    api: 'admin/dashboard',
    refs: false,
    filter: {},
  }),
  persist: {
    pick: ['filter'],
  },
  getters: {
    getFilter: (state): Dictionary => {
      const { name } = state;
      return (name && state.filter[name]) ?? {};
    },
  },
  actions: {
    update({ name, module, api, refs }: Pick<Resource, 'name' | 'module' | 'api' | 'refs'>) {
      this.name = name;
      this.module = module;
      this.api = api;
      this.refs = !!refs;
    },

    async setFilter(filter: Dictionary) {
      this.filter = {
        ...this.filter,
        [this.name]: filter,
      };
    },

    async resetFilter() {
      const { [this.name]: _remove, ...rest } = this.filter;

      this.filter = { ...rest };
    },
  },
});

export type ResourceStoreDef = typeof useResource;

export type ResourceStore = ReturnType<ResourceStoreDef>;
