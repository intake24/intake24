import type { ZodError, ZodType } from 'zod';

export interface FormattedError {
  path: string;
  errors: string[];
}

export interface FormatZodErrorOptions {
  groupingDepth?: number;
  handleDiscriminatedUnions?: boolean;
  pathRemapper?: (pathElements: (string | number)[]) => string;
}

interface CollectedError {
  path: (string | number)[];
  message: string;
}

// --- Schema navigation helpers ---

function unwrapSchema(schema: any): any {
  if (!schema)
    return schema;

  const def = schema?._zod?.def;
  if (!def)
    return schema;

  if (def.type === 'optional' || def.type === 'nullable' || def.type === 'default')
    return unwrapSchema(def.innerType);

  return schema;
}

function resolveSchemaAtPath(schema: any, path: (string | number)[]): any {
  let current = unwrapSchema(schema);

  for (const segment of path) {
    if (!current)
      return undefined;

    current = unwrapSchema(current);
    const def = current?._zod?.def;
    if (!def)
      return undefined;

    if (def.type === 'object' && def.shape) {
      current = def.shape[segment as string];
    }
    else if (def.type === 'array' && def.element) {
      current = def.element;
    }
    else {
      return undefined;
    }
  }

  return unwrapSchema(current);
}

function getValueAtPath(input: unknown, path: (string | number)[]): unknown {
  let current: any = input;
  for (const segment of path) {
    if (current == null)
      return undefined;
    current = current[segment];
  }
  return current;
}

// --- Union / discriminated union helpers ---

function getDiscriminatorValues(unionSchema: any, discriminator: string): string[] {
  const def = unionSchema?._zod?.def;
  if (!def || def.type !== 'union')
    return [];

  const values: string[] = [];
  for (const option of def.options ?? []) {
    const optDef = option?._zod?.def;
    if (optDef?.type === 'object' && optDef.shape) {
      const fieldDef = optDef.shape[discriminator]?._zod?.def;
      if (fieldDef?.type === 'literal' && Array.isArray(fieldDef.values))
        values.push(...fieldDef.values.map(String));
    }
  }
  return values;
}

/**
 * Detect a discriminator-like field in a regular z.union schema.
 * Returns the field name if all options are objects sharing a common literal field.
 */
function detectDiscriminatorField(schema: any): string | null {
  const def = schema?._zod?.def;
  if (!def || def.type !== 'union')
    return null;

  if (def.discriminator)
    return def.discriminator;

  const options = def.options;
  if (!Array.isArray(options) || options.length < 2)
    return null;

  const firstDef = options[0]?._zod?.def;
  if (!firstDef || firstDef.type !== 'object' || !firstDef.shape)
    return null;

  const candidates: string[] = [];
  for (const [key, fieldSchema] of Object.entries(firstDef.shape)) {
    const fieldDef = (fieldSchema as any)?._zod?.def;
    if (fieldDef?.type === 'literal')
      candidates.push(key);
  }

  for (const candidate of candidates) {
    let valid = true;
    for (const option of options) {
      const optDef = option?._zod?.def;
      if (!optDef || optDef.type !== 'object' || !optDef.shape) {
        valid = false;
        break;
      }
      const fDef = (optDef.shape[candidate] as any)?._zod?.def;
      if (!fDef || fDef.type !== 'literal') {
        valid = false;
        break;
      }
    }
    if (valid)
      return candidate;
  }

  return null;
}

function handleDiscriminatorLikeUnion(
  issue: any,
  discriminatorField: string,
  unionSchema: any,
  input: unknown,
  issuePath: (string | number)[],
): CollectedError[] {
  const inputValue = getValueAtPath(input, [...issuePath, discriminatorField]);
  const options = unionSchema._zod.def.options;

  // Find which variant matches the discriminator value
  let matchingIndex = -1;
  for (let i = 0; i < options.length; i++) {
    const optDef = options[i]?._zod?.def;
    if (optDef?.type === 'object' && optDef.shape) {
      const fieldDef = optDef.shape[discriminatorField]?._zod?.def;
      if (fieldDef?.type === 'literal' && fieldDef.values?.includes(inputValue)) {
        matchingIndex = i;
        break;
      }
    }
  }

  if (matchingIndex >= 0 && Array.isArray(issue.errors?.[matchingIndex])) {
    // Discriminator matched a variant — show field-level errors for that variant
    const variantErrors = issue.errors[matchingIndex] as any[];
    const fieldErrors = variantErrors
      .filter((e: any) => e.path?.[0] !== discriminatorField)
      .map((e: any) => {
        const p = (e.path ?? []).join('.');
        return p ? `${p}: ${e.message}` : e.message;
      });

    if (fieldErrors.length > 0) {
      const message = `'${inputValue}' is not valid because: ${fieldErrors.join('; ')}`;
      return [{ path: issuePath, message }];
    }
  }

  // No match — report invalid discriminator value
  const validValues = getDiscriminatorValues(unionSchema, discriminatorField);
  const message = `Invalid value '${inputValue}'. Expected one of: ${validValues.map(v => `'${v}'`).join(', ')}`;
  return [{ path: issuePath, message }];
}

function handlePlainUnion(issue: any, issuePath: (string | number)[]): CollectedError[] {
  const errors = issue.errors as any[][];

  // Find the variant with fewest errors (closest match)
  let bestVariant = errors[0] ?? [];
  for (let i = 1; i < errors.length; i++) {
    if (errors[i].length < bestVariant.length)
      bestVariant = errors[i];
  }

  if (bestVariant.length > 0) {
    const fieldErrors = bestVariant.map((e: any) => {
      const p = (e.path ?? []).join('.');
      return p ? `${p}: ${e.message}` : e.message;
    });
    const message = `Union validation failed. Closest match errors: ${fieldErrors.join('; ')}`;
    return [{ path: issuePath, message }];
  }

  return [{ path: issuePath, message: issue.message }];
}

// --- Main issue processing ---

function handleUnionIssue(
  issue: any,
  rootSchema: ZodType,
  input: unknown,
): CollectedError[] {
  const issuePath = normalizePath(issue.path);

  // Case 1: Discriminated union — no matching discriminator
  if (issue.note === 'No matching discriminator' && issue.discriminator) {
    const discriminator = issue.discriminator as string;
    const unionPath = issuePath.slice(0, -1);
    const unionSchema = resolveSchemaAtPath(rootSchema, unionPath);

    if (unionSchema) {
      const validValues = getDiscriminatorValues(unionSchema, discriminator);
      const inputValue = getValueAtPath(input, [...unionPath, discriminator]);
      const message = `Invalid value '${inputValue}'. Expected one of: ${validValues.map(v => `'${v}'`).join(', ')}`;
      return [{ path: issuePath, message }];
    }

    return [{ path: issuePath, message: issue.message }];
  }

  // Case 2: Union with an errors array
  if (Array.isArray(issue.errors) && issue.errors.length > 0) {
    const unionSchema = resolveSchemaAtPath(rootSchema, issuePath);
    const discriminatorField = unionSchema ? detectDiscriminatorField(unionSchema) : null;

    if (discriminatorField)
      return handleDiscriminatorLikeUnion(issue, discriminatorField, unionSchema, input, issuePath);

    return handlePlainUnion(issue, issuePath);
  }

  // Fallback
  return [{ path: issuePath, message: issue.message }];
}

function normalizePath(path: PropertyKey[]): (string | number)[] {
  return (path ?? []).map(p =>
    typeof p === 'symbol' ? String(p) : p,
  ) as (string | number)[];
}

// --- Public API ---

export function formatZodError(
  error: ZodError,
  schema: ZodType,
  input: unknown,
  options?: FormatZodErrorOptions,
): FormattedError[] {
  const {
    groupingDepth = Infinity,
    handleDiscriminatedUnions = true,
    pathRemapper,
  } = options ?? {};

  const collected: CollectedError[] = [];

  for (const issue of error.issues) {
    if ((issue as any).code === 'invalid_union' && handleDiscriminatedUnions) {
      collected.push(...handleUnionIssue(issue, schema, input));
    }
    else {
      collected.push({
        path: normalizePath(issue.path),
        message: issue.message,
      });
    }
  }

  // Group by path prefix based on groupingDepth
  const groups = new Map<string, { pathElements: (string | number)[]; messages: string[] }>();

  for (const { path, message } of collected) {
    const groupPath = path.length <= groupingDepth ? path : path.slice(0, groupingDepth);
    const remainingPath = path.length <= groupingDepth ? [] : path.slice(groupingDepth);

    const groupKey = groupPath.length === 0 ? '(root)' : groupPath.join('.');

    const fullMessage = remainingPath.length > 0
      ? `${remainingPath.join('.')}: ${message}`
      : message;

    const existing = groups.get(groupKey);
    if (existing) {
      if (!existing.messages.includes(fullMessage))
        existing.messages.push(fullMessage);
    }
    else {
      groups.set(groupKey, { pathElements: groupPath, messages: [fullMessage] });
    }
  }

  const result: FormattedError[] = [];

  for (const [groupKey, { pathElements, messages }] of groups) {
    const path = pathRemapper && pathElements.length > 0
      ? pathRemapper(pathElements)
      : groupKey;

    result.push({ path, errors: messages });
  }

  return result;
}

export function formatZodErrorAsString(
  error: ZodError,
  schema: ZodType,
  input: unknown,
  options?: FormatZodErrorOptions,
): string {
  const formatted = formatZodError(error, schema, input, options);

  return formatted
    .map(({ path, errors }) => {
      const errorLines = errors.map(e => `  - ${e}`).join('\n');
      if (path === '(root)')
        return errorLines;
      return `${path}:\n${errorLines}`;
    })
    .join('\n\n');
}
