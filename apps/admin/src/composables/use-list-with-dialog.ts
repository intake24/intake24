import type { Ref, SetupContext, UnwrapRef } from 'vue';

import type { ReturnUseErrors } from './use-errors';

import { deepEqual } from 'fast-equals';
import { computed, ref, toRefs, useTemplateRef, watch } from 'vue';
import { VForm } from 'vuetify/components';

import { copy } from '@intake24/common/util';

export type ListProps<O> = {
  modelValue: O[];
  defaults?: O[];
  errors?: ReturnUseErrors;
};

export type ListOps<I, O = I> = {
  newItem: () => I;
  transformIn?: (item: O, index: number) => I;
  transformOut?: (item: UnwrapRef<I>, index: number) => O;
  watch?: boolean;
  errorPrefix?: string;
};

// TODO: fix generic types casting

export function useListWithDialog<I, O = I>(props: ListProps<O>, { emit }: Pick<SetupContext<'update:modelValue'[]>, 'emit'>, ops: ListOps<I, O>) {
  const { modelValue } = toRefs(props);
  const { newItem, transformIn, transformOut } = ops;
  const form = useTemplateRef<InstanceType<typeof VForm>>('form');

  const items = ref(copy(transformIn ? modelValue.value.map(transformIn) : modelValue.value)) as Ref<
    UnwrapRef<I>[]
  >;
  const errors = computed(() => items.value.map((_, index) => props.errors?.get(`henryCoefficients.${index}.*`)));

  const outputItems = computed(() => (transformOut ? items.value.map(transformOut) : items.value));

  const newDialog = (show = false) => ({
    show,
    index: -1,
    item: newItem() as UnwrapRef<I>,
  });

  const dialog = ref({
    show: false,
    index: -1,
    item: newItem(),
  });

  watch(modelValue, (val) => {
    if (deepEqual(val, outputItems.value))
      return;

    items.value = copy(transformIn ? val.map(transformIn) : val) as any;
  });

  if (ops.watch) {
    watch(outputItems, (val) => {
      emit('update:modelValue', val);
    }, { deep: true });
  }

  function clearErrors(index?: number) {
    if (!props.errors)
      return;

    const prefix = [];
    if (ops.errorPrefix)
      prefix.push(ops.errorPrefix);

    if (typeof index === 'number')
      prefix.push(index);

    prefix.push('*');

    props.errors.clear(prefix.join('.'));
  }

  const add = () => {
    dialog.value = newDialog(true);
  };

  const edit = (index: number, item: UnwrapRef<I>) => {
    dialog.value = { show: true, index, item: copy(item) };
  };

  const update = () => {
    if (ops.watch)
      return;

    emit('update:modelValue', outputItems.value);
  };

  const load = (list: UnwrapRef<I>[]) => {
    clearErrors();
    items.value = [...list];
    update();
  };

  const remove = (index: number) => {
    clearErrors(index);
    items.value.splice(index, 1);
    update();
  };

  const reset = () => {
    dialog.value = newDialog();
    form.value?.resetValidation();
  };

  const resetList = () => {
    if (!props.defaults)
      return;

    clearErrors();
    items.value = [...props.defaults] as UnwrapRef<I>[];
    update();
  };

  const save = async () => {
    const { valid } = await form.value?.validate() ?? {};
    if (!valid)
      return;

    const { index, item } = dialog.value;

    if (index === -1)
      items.value.push(item);
    else items.value.splice(index, 1, item);

    clearErrors(index);
    reset();
    update();
  };

  return {
    form,
    items,
    dialog,
    errors,
    newDialog,
    add,
    edit,
    load,
    remove,
    reset,
    save,
    update,
    resetList,
  };
}
