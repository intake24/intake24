import type { SetupContext } from 'vue';

export function useBasePrompt(props: any, context: Pick<SetupContext<'update:options'[]>, 'emit'>) {
  const update = (field: string, value: any) => {
    context.emit('update:options', { [field]: value });
  };
  const updateNumber = (field: string, value: any, fallback = null) => {
    const number = Number(value);
    context.emit('update:options', {
      [field]: Number.isNaN(number)
        ? fallback
        : number,
    });
  };
  const updateInteger = (field: string, value: any, fallback = null) => {
    const integer = Number.parseInt(value, 10);
    context.emit('update:options', {
      [field]: Number.isNaN(integer)
        ? fallback
        : integer,
    });
  };
  const updateLanguage = (field: string, lang: string, value: any) => {
    context.emit('update:options', {
      [field]: { ...props[field], [lang]: value },
    });
  };

  return {
    update,
    updateNumber,
    updateInteger,
    updateLanguage,
  };
}
