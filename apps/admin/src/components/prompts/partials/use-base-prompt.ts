import type { SetupContext } from 'vue';

type KeysAccepting<P, V> = { [K in keyof P]-?: V extends P[K] ? K : never }[keyof P];
type TranslationKeys<P> = { [K in keyof P]-?: NonNullable<P[K]> extends Record<string, unknown> ? K : never }[keyof P];
type TranslationValue<T> = T extends Record<string, infer V> ? V : never;

export function useBasePrompt<P extends object>(props: P, context: Pick<SetupContext<'update:options'[]>, 'emit'>) {
  const update = <K extends keyof P>(field: K, value: P[K]) => {
    context.emit('update:options', { [field]: value });
  };
  const updateNumber = <K extends KeysAccepting<P, number | null>>(field: K, value: string) => {
    const number = Number(value);
    context.emit('update:options', {
      [field]: Number.isNaN(number)
        ? null
        : number,
    });
  };
  const updateTime = <K extends KeysAccepting<P, string>>(field: K, value: string | null) => {
    if (value === null)
      throw new Error(`Time picker emitted null for ${String(field)}`);

    context.emit('update:options', { [field]: value });
  };
  const updateLanguage = <K extends TranslationKeys<P>>(field: K, lang: string, value: TranslationValue<P[K]>) => {
    context.emit('update:options', {
      [field]: { ...props[field], [lang]: value },
    });
  };

  return {
    update,
    updateNumber,
    updateTime,
    updateLanguage,
  };
}
