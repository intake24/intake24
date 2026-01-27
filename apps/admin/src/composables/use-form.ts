import type { Ref } from 'vue';

import type { HttpRequestConfig } from '@intake24/ui/services';

import axios, { HttpStatusCode } from 'axios';
import { pick } from 'lodash-es';
import { computed, ref } from 'vue';

import { copy, getObjectNestedKeys, merge } from '@intake24/common/util';

import { useHttp } from '../services';
import { useErrors } from './use-errors';

const expectedFailStatusCodes = [HttpStatusCode.BadRequest, HttpStatusCode.Conflict] as const;

export type FormConfig<T = any> = {
  status?: string;
  multipart?: boolean;
  resetOnSubmit?: boolean;
  extractNestedKeys?: boolean;
  transform?: (data: T) => any;
};

export type UseFormProps<F> = {
  data: F;
  config?: FormConfig;
  loadCallback?: (data: any) => any;
  nonInputErrorKeys?: string[];
};

export function useForm<T extends object>(props: UseFormProps<T>) {
  const http = useHttp();
  const { loadCallback, nonInputErrorKeys = [] } = props;

  const formConfig = computed(() => ({
    multipart: false,
    resetOnSubmit: true,
    ...props.config,
  }));

  const keys = computed(() => Object.keys(props.data) as (keyof T)[]);
  const allKeys = computed(() => props.config?.extractNestedKeys
    ? getObjectNestedKeys(props.data)
    : ([...keys.value] as string[]));

  const data = ref(copy(props.data)) as Ref<T>;
  const errors = useErrors();

  const nonInputErrors = computed(() => Object.values(pick(errors.errors.value, nonInputErrorKeys)));

  function assign<S extends Partial<T>>(source: S) {
    data.value = merge<T, S>(props.data, pick(source, allKeys.value));
  };

  function load<S extends Partial<T>>(source: S) {
    reset();
    assign(source);
  };

  function reset(): void {
    errors.clear();
    data.value = copy(props.data);
  };

  function getData(): T {
    return data.value;
  };

  function toForm(data: any) {
    const input = loadCallback ? loadCallback(data) : data;

    load(input);
  };

  const clearError = (event: KeyboardEvent) => {
    const { name } = event.target as HTMLInputElement;

    if (name)
      errors.clear(name);
  };

  function onSuccess() {
    if (formConfig.value.resetOnSubmit)
      reset();
  };

  function onFail(err: unknown) {
    if (!axios.isAxiosError(err))
      return;

    const { response: { status, data = {} } = {} } = err;
    if (status !== undefined && expectedFailStatusCodes.includes(status) && 'errors' in data)
      errors.record(data.errors);
  };

  async function submit<R>(config: HttpRequestConfig): Promise<R> {
    const { transform, multipart } = formConfig.value;

    try {
      const { data } = await http.request<R>({
        data: transform ? transform(getData() as T) : getData(),
        withLoading: true,
        headers: multipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
        ...config,
      });

      onSuccess();
      return data;
    }
    catch (err) {
      onFail(err);

      throw err;
    }
  };

  async function post<R>(url: string, config?: HttpRequestConfig): Promise<R> {
    return await submit<R>({ url, method: 'post', ...config });
  };

  async function get<R>(url: string, config?: HttpRequestConfig): Promise<R> {
    return await submit<R>({ url, method: 'get', ...config });
  };

  async function patch<R>(url: string, config?: HttpRequestConfig): Promise<R> {
    return await submit<R>({ url, method: 'patch', ...config });
  };

  async function put<R>(url: string, config?: HttpRequestConfig): Promise<R> {
    return await submit<R>({ url, method: 'put', ...config });
  };

  return {
    allKeys,
    errors,
    getData,
    data,
    keys,
    nonInputErrorKeys,
    nonInputErrors,
    toForm,
    clearError,
    load,
    reset,
    submit,
    get,
    post,
    patch,
    put,
  };
}
