import axios, { HttpStatusCode } from 'axios';
import { defineStore } from 'pinia';
import type { Dictionary } from '@intake24/common/types';
import type { UserSecurableAttributes } from '@intake24/common/types/http/admin';
import { useHttp } from '../services';
import { useResource } from './resource';

export type ItemState = {
  securables?: UserSecurableAttributes[];
  [key: string]: any;
};

export type EntryState = {
  data: ItemState;
  refs: Dictionary;
};

export const useEntry = defineStore('entry', {
  state: (): EntryState => ({
    data: {},
    refs: {},
  }),
  getters: {
    getEntry: <T>(state: EntryState): T => state.data as T,
    dataLoaded: state => !!Object.keys(state.data).length,
    getRefs: <T>(state: EntryState): T => state.refs as T,
    refsLoaded: state => !!Object.keys(state.refs).length,
  },
  actions: {
    async requestEntry({
      id,
      api = useResource().api,
      query,
    }: {
      id: string;
      api?: string;
      query?: any;
    }) {
      this.clearEntry();

      if (id === 'create') {
        this.initEntry();
        await this.requestRefs();
        return;
      }

      const apiUrl = [api, id].join('/');

      const { data } = await useHttp().get(apiUrl, { params: query, withLoading: true });
      this.setEntry(data);

      await this.requestRefs();
    },

    async requestRefs() {
      const { api, refs } = useResource();
      if (!refs)
        return;

      this.clearRefs();

      try {
        const { data } = await useHttp().get(`${api}/refs`, { withLoading: true });
        this.setRefs(data);
      }
      catch (err) {
        if (axios.isAxiosError(err) && err.response?.status !== HttpStatusCode.NotFound)
          throw err;
      }
    },

    clearEntry() {
      this.data = {};
    },

    initEntry() {
      this.data = { ...{ id: null } };
    },

    setEntry(data?: Dictionary) {
      if (data)
        this.data = { ...(data ?? { id: null }) };
    },

    updateEntry(data: Partial<Dictionary>) {
      this.data = { ...this.data, ...data };
    },

    clearRefs() {
      this.refs = {};
    },

    setRefs(refs?: Dictionary) {
      if (refs)
        this.refs = { ...refs };
    },
  },
});

export type EntryStoreDef = typeof useEntry;

export type EntryStore = ReturnType<EntryStoreDef>;
