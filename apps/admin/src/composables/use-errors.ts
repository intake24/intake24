import { pick } from 'lodash-es';
import { computed, ref } from 'vue';

export type ValidationError = {
  location: string;
  msg: string;
  path: string;
  type: string;
  value: string;
};

export type ValidationErrors = Record<string, ValidationError>;

export type UseErrorProps = {
  nonInputErrorKeys?: string[];
};

export function useErrors(props: UseErrorProps = {}) {
  const { nonInputErrorKeys = [] } = props;

  const errors = ref<ValidationErrors>({});

  const nonInputErrors = computed(() => Object.values(pick(errors.value, nonInputErrorKeys)));
  const all = computed(() => errors.value);
  const any = computed(() => !!Object.keys(errors.value).length);

  function get(field: string) {
    if (!any.value)
      return [];

    if (!field.endsWith('*'))
      return [errors.value[field]?.msg].filter(Boolean);

    const match = field.slice(0, -1);

    return Object.entries(errors.value).reduce<string[]>((acc, [key, value]) => {
      if (key.startsWith(match))
        acc.push(value.msg);

      return acc;
    }, []);
  };

  function getErrors(field?: string[]) {
    if (!any.value)
      return [];

    if (!field)
      return Object.values(errors.value);

    return Object.values(pick(errors.value, field));
  };

  function has(field: string) {
    if (!field.endsWith('*'))
      return Object.prototype.hasOwnProperty.call(errors.value, field);

    const match = field.slice(0, -1);

    return Object.keys(errors.value).some(key => key === field || key.startsWith(match),
    );
  };

  function record(items?: ValidationErrors) {
    if (typeof items !== 'undefined')
      errors.value = items;
  };

  function clear(field?: string | string[]) {
    if (Array.isArray(field)) {
      field.forEach(item => delete errors.value[item]);
      return;
    }

    if (!field) {
      errors.value = {};
      return;
    };

    if (field.endsWith('*')) {
      const match = field.slice(0, -1);
      Object.keys(errors.value).forEach((key) => {
        if (key.startsWith(match))
          delete errors.value[key];
      });
      return;
    }

    const { [field]: discard, ...rest } = errors.value;
    errors.value = { ...rest };
  };

  return {
    all,
    any,
    errors,
    get,
    has,
    getErrors,
    nonInputErrors,
    record,
    clear,
  };
}

export type ReturnUseErrors = ReturnType<typeof useErrors>;
