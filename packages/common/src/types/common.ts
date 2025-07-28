import { z } from 'zod';

export const frontEnds = ['admin', 'survey'] as const;

export type FrontEnd = (typeof frontEnds)[number];

export const applications = [...frontEnds, 'api', 'shared'] as const;

export type Application = (typeof applications)[number];

export const isApplication = (app: any): app is Application => applications.includes(app);

export const customField = z.object({
  name: z.string().min(1).max(128),
  value: z.union([z.string(), z.number(), z.boolean(), z.date()]).pipe(z.coerce.string().min(1).max(512)),
});
export type CustomField = z.infer<typeof customField>;

export const userCustomField = customField.extend({
  public: z.boolean().optional(),
});
export type UserCustomField = z.infer<typeof userCustomField>;

export const customFieldRecord = z.record(customField.shape.name, customField.shape.value);
export type CustomFieldRecord = z.infer<typeof customFieldRecord>;

export type Dictionary<T = any> = { [key: string]: T };

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type PartialRecord<K extends keyof any, T> = {
  [P in K]?: T;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type OmitAndOptional<T, KOmit extends keyof T, KOptional extends keyof T> = Omit<
  T,
  KOmit | KOptional
>
& Partial<Pick<T, KOptional>>;

export type WithKey<K extends string | number | symbol> = {
  [k in K]: string;
};

export type UnwrapAII<P> = P extends AsyncIterableIterator<infer T> ? T : never;

export const emailCopy = ['cc', 'bcc', 'none'] as const;

export type EmailCopy = (typeof emailCopy)[number];

export type Environment = 'development' | 'test' | 'production';

export const localeTranslation = z.record(z.string().nullable());

export type LocaleTranslation = z.infer<typeof localeTranslation>;

export const requiredLocaleTranslation = z.intersection(
  z.object({ en: z.string() }),
  z.record(z.string().nullable()),
);
export type RequiredLocaleTranslation = z.infer<typeof requiredLocaleTranslation>;

export function requiredLocaleTranslationWithLimit(options: { min?: number; max: number }) {
  const { min = 1, max } = options;
  return z.intersection(
    z.object({ en: z.string().min(min).max(max) }),
    z.record(z.string().min(min).max(max).nullable()),
  );
}

export function listOption<T extends z.ZodTypeAny = z.ZodString>(valueSchema?: T) {
  return z.object({
    id: z.number().optional(),
    label: z.string().min(1).max(256),
    shortLabel: z.string().min(1).max(256).optional(),
    value: valueSchema ?? z.string().min(1).max(256),
    exclusive: z.boolean().optional(),
    selected: z.boolean().optional(),
  });
}

export type ListOption<T extends z.ZodTypeAny = z.ZodString> = z.infer<
  ReturnType<typeof listOption<T>>
>;

export function localeOptionList<T extends z.ZodTypeAny = z.ZodString>({ valueSchema, limit }: { valueSchema?: T; limit?: number } = {}) {
  const scheme = z.intersection(
    z.object({
      en: z.array(listOption(valueSchema)),
    }),
    z.record(z.array(listOption(valueSchema))),
  );

  if (!limit)
    return scheme;

  return scheme.superRefine((data, ctx) => {
    const length = Object.values(data).flat().map(item => item.value).join('').length;
    if (length <= limit)
      return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Combined options values are too long, limit is ${limit} characters`,
    });
  });
}

export type LocaleOptionList<T extends z.ZodTypeAny = z.ZodString> = z.infer<
  ReturnType<typeof localeOptionList<T>>
>;

export function categoryLocaleOptionList<T extends z.ZodTypeAny = z.ZodNumber>(valueSchema: T) {
  return z.intersection(
    z.object({
      _default: localeOptionList({ valueSchema }),
    }),
    z.record(localeOptionList({ valueSchema })),
  );
}

export type CategoryLocaleOptionList<T extends z.ZodTypeAny = z.ZodNumber> = z.infer<
  ReturnType<typeof categoryLocaleOptionList<T>>
>;

export const textDirections = ['ltr', 'rtl'] as const;
export type TextDirection = (typeof textDirections)[number];
