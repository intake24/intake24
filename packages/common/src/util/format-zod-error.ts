import type { z } from 'zod';

type ZodIssue = z.ZodIssue;

export interface FormattedError {
  path: string;
  errors: string[];
}

export interface FormatZodErrorOptions {
  /**
   * Maximum depth of path elements to group errors by.
   * For example, if groupingDepth is 2 and the error path is ["a", "b", "c", "d"],
   * the grouped path will be "a.b" with the error message including context about "c" and "d".
   * Default: Infinity (no grouping, full paths)
   */
  groupingDepth?: number;

  /**
   * If true, attempts to identify the discriminator key for union errors and provide
   * clearer messages about which variant failed validation.
   * Default: true
   */
  handleDiscriminatedUnions?: boolean;

  /**
   * Optional Zod schema to use for extracting discriminator information.
   * If provided, the formatter will attempt to identify discriminated unions
   * and provide more meaningful error messages.
   */
  schema?: z.ZodTypeAny;

  /**
   * Optional function to remap path prefixes to more meaningful strings.
   * Receives the groupable prefix path (up to groupingDepth elements) and
   * should return a human-readable string.
   *
   * @example
   * // Remap array indices to item codes
   * pathRemapper: (pathElements) => {
   *   if (pathElements[0] === 'foods' && pathElements[1] !== undefined) {
   *     const foodCode = foodsList[Number(pathElements[1])]?.code;
   *     return `Food "${foodCode}"`;
   *   }
   *   return pathElements.join('.');
   * }
   */
  pathRemapper?: (pathElements: (string | number)[]) => string;
}

/**
 * Formats a Zod error into a readable structure with grouped error messages.
 *
 * @example
 * // With grouping depth of 2:
 * // Input path: ["items", "0", "portionSizeMethod", "method"]
 * // Output: { path: "items.0", errors: ["portionSizeMethod.method: ..."] }
 */
export function formatZodError(
  error: z.ZodError,
  options: FormatZodErrorOptions = {},
): FormattedError[] {
  const {
    groupingDepth = Infinity,
    handleDiscriminatedUnions = true,
    pathRemapper,
  } = options;

  // First, process and enhance union/discriminated union errors
  const processedIssues = handleDiscriminatedUnions
    ? processUnionErrors(error.issues)
    : error.issues;

  // Group issues by their path prefix
  const groupedErrors = groupIssuesByPath(processedIssues, groupingDepth, pathRemapper);

  return Object.entries(groupedErrors).map(([path, messages]) => ({
    path,
    errors: messages,
  }));
}

/**
 * Processes union errors to provide clearer messages.
 * Instead of showing "Invalid literal value, expected X" for each union option,
 * it identifies the discriminator and shows which values were expected.
 */
function processUnionErrors(issues: ZodIssue[]): ZodIssue[] {
  const result: ZodIssue[] = [];
  const unionErrorsByPath = new Map<string, ZodIssue[]>();

  for (const issue of issues) {
    if (issue.code === 'invalid_union') {
      // Group sub-errors from the union
      const pathKey = issue.path.join('.');
      const existingUnionErrors = unionErrorsByPath.get(pathKey) || [];
      existingUnionErrors.push(issue);
      unionErrorsByPath.set(pathKey, existingUnionErrors);
    }
    else if (issue.code === 'invalid_literal') {
      // These are typically union discriminator errors - collect them
      const pathKey = issue.path.join('.');
      const existingUnionErrors = unionErrorsByPath.get(pathKey) || [];
      existingUnionErrors.push(issue);
      unionErrorsByPath.set(pathKey, existingUnionErrors);
    }
    else {
      result.push(issue);
    }
  }

  // Process grouped union errors
  for (const [pathKey, unionIssues] of unionErrorsByPath) {
    const synthesizedIssue = synthesizeUnionError(pathKey, unionIssues);
    if (synthesizedIssue) {
      result.push(synthesizedIssue);
    }
    else {
      result.push(...unionIssues);
    }
  }

  return result;
}

/**
 * Synthesizes multiple union/literal errors into a more readable message.
 */
function synthesizeUnionError(pathKey: string, issues: ZodIssue[]): ZodIssue | null {
  // Check if these are all invalid_literal errors for the same path (discriminator errors)
  const literalErrors = issues.filter((i): i is z.ZodIssue & { code: 'invalid_literal' } =>
    i.code === 'invalid_literal',
  );

  if (literalErrors.length > 0) {
    const expectedValues = literalErrors
      .map(e => JSON.stringify(e.expected))
      .filter((v, i, arr) => arr.indexOf(v) === i); // unique values

    const receivedValue = literalErrors[0]?.received;
    const path = issues[0]?.path || [];

    return {
      code: 'custom',
      path,
      message: `Invalid value ${JSON.stringify(receivedValue)}. Expected one of: ${expectedValues.join(', ')}`,
    };
  }

  // Handle complex union errors (invalid_union)
  const invalidUnionErrors = issues.filter((i): i is z.ZodIssue & { code: 'invalid_union' } =>
    i.code === 'invalid_union',
  );

  if (invalidUnionErrors.length > 0) {
    // Analyze union errors to find the best match and provide helpful context
    const analyzedError = analyzeUnionErrors(invalidUnionErrors);
    if (analyzedError) {
      return analyzedError;
    }
  }

  return null;
}

/**
 * Analyzes union errors to find:
 * 1. The discriminator key (if it's a discriminated union)
 * 2. Whether the discriminator value is actually valid in one of the branches
 * 3. If discriminator is valid, show the actual field errors from that branch
 * 4. If discriminator is invalid, show expected values
 */
function analyzeUnionErrors(unionErrors: (z.ZodIssue & { code: 'invalid_union' })[]): ZodIssue | null {
  if (unionErrors.length === 0)
    return null;

  const firstUnion = unionErrors[0];
  if (!firstUnion)
    return null;

  const unionErrors0 = firstUnion.unionErrors;
  if (!unionErrors0 || unionErrors0.length === 0)
    return null;

  // The union path prefix - we'll strip this from inner error paths
  const unionPathLength = firstUnion.path.length;

  // Try to identify a discriminator pattern and find matching branches
  const analysis = analyzeDiscriminatedUnion(unionErrors0);

  if (analysis.discriminatorKey) {
    // This is a discriminated union
    const discriminatorPath = [...firstUnion.path, analysis.discriminatorKey];

    if (analysis.matchingBranches.length > 0) {
      // The discriminator value IS valid - show errors from the matching branch(es)
      // Use the branch with fewest errors as it's most likely the intended one
      const bestMatch = analysis.matchingBranches.reduce((best, current) =>
        current.issues.length < best.issues.length ? current : best,
      );

      const nonLiteralIssues = bestMatch.issues.filter(i => i.code !== 'invalid_literal');

      if (nonLiteralIssues.length > 0) {
        const issueMessages = nonLiteralIssues.map((i) => {
          // Strip the union path prefix to get the relative path
          const relativePath = i.path.slice(unionPathLength);
          return `${formatPath(relativePath)}: ${i.message}`;
        });

        return {
          code: 'custom',
          path: firstUnion.path,
          message: `'${String(analysis.receivedValue)}' is not valid because: ${issueMessages.join('; ')}`,
        };
      }
    }
    else {
      // The discriminator value is actually invalid - not found in any branch
      return {
        code: 'custom',
        path: discriminatorPath,
        message: `Invalid discriminator value ${JSON.stringify(analysis.receivedValue)}. Expected one of: ${analysis.expectedValues.join(', ')}`,
      };
    }
  }

  // Not a discriminated union, find the best match and show its errors
  const bestMatch = findBestMatchingUnionMember(unionErrors0);

  if (bestMatch) {
    // Return a synthesized error that shows the closest match's issues
    const issues = bestMatch.issues;
    const nonLiteralIssues = issues.filter(i => i.code !== 'invalid_literal');

    if (nonLiteralIssues.length > 0) {
      const issueMessages = nonLiteralIssues.map((i) => {
        // Strip the union path prefix to get the relative path
        const relativePath = i.path.slice(unionPathLength);
        return `${formatPath(relativePath)}: ${i.message}`;
      });

      return {
        code: 'custom',
        path: firstUnion.path,
        message: `Union validation failed. Closest match errors: ${issueMessages.join('; ')}`,
      };
    }
  }

  return null;
}

interface DiscriminatedUnionAnalysis {
  discriminatorKey: string | null;
  expectedValues: string[];
  receivedValue: unknown;
  matchingBranches: z.ZodError[];
}

/**
 * Analyzes a discriminated union to find:
 * 1. The discriminator key
 * 2. All possible expected values
 * 3. Branches where the discriminator matches (no literal error on discriminator)
 */
function analyzeDiscriminatedUnion(unionErrors: z.ZodError[]): DiscriminatedUnionAnalysis {
  const analysis: DiscriminatedUnionAnalysis = {
    discriminatorKey: null,
    expectedValues: [],
    receivedValue: undefined,
    matchingBranches: [],
  };

  // First pass: identify the discriminator key and all expected values
  const literalErrorsByKey = new Map<string, { expected: unknown; received: unknown; branchIndex: number }[]>();

  for (let branchIndex = 0; branchIndex < unionErrors.length; branchIndex++) {
    const unionError = unionErrors[branchIndex];
    if (!unionError)
      continue;

    for (const issue of unionError.issues) {
      if (issue.code === 'invalid_literal') {
        const key = issue.path[issue.path.length - 1]?.toString() || '';
        const existing = literalErrorsByKey.get(key) || [];
        existing.push({ expected: issue.expected, received: issue.received, branchIndex });
        literalErrorsByKey.set(key, existing);
      }
    }
  }

  // Find the most likely discriminator key (appears in most branches)
  let bestKey: string | null = null;
  let bestCount = 0;

  for (const [key, errors] of literalErrorsByKey) {
    if (errors.length > bestCount) {
      bestCount = errors.length;
      bestKey = key;
    }
  }

  if (!bestKey || bestCount < unionErrors.length * 0.5) {
    // Not enough evidence of a discriminator pattern
    return analysis;
  }

  analysis.discriminatorKey = bestKey;
  const discriminatorErrors = literalErrorsByKey.get(bestKey) || [];

  // Collect all expected values and the received value
  analysis.expectedValues = [...new Set(discriminatorErrors.map(e => JSON.stringify(e.expected)))];
  analysis.receivedValue = discriminatorErrors[0]?.received;

  // Find branches that DON'T have a literal error on the discriminator key
  // These are branches where the discriminator matched
  const branchesWithDiscriminatorError = new Set(discriminatorErrors.map(e => e.branchIndex));

  for (let branchIndex = 0; branchIndex < unionErrors.length; branchIndex++) {
    if (!branchesWithDiscriminatorError.has(branchIndex)) {
      const branch = unionErrors[branchIndex];
      if (branch) {
        analysis.matchingBranches.push(branch);
      }
    }
  }

  return analysis;
}

/**
 * Finds the union member that has the fewest validation errors.
 * This is likely the intended type the user was trying to use.
 */
function findBestMatchingUnionMember(unionErrors: z.ZodError[]): z.ZodError | null {
  if (unionErrors.length === 0)
    return null;

  // Score each union error by the number of issues (fewer is better)
  // Also prefer errors that don't have literal mismatch (those are discriminator errors)
  let bestMatch = unionErrors[0] ?? null;
  let bestScore = Infinity;

  for (const error of unionErrors) {
    const literalIssues = error.issues.filter(i => i.code === 'invalid_literal').length;
    const otherIssues = error.issues.length - literalIssues;

    // If there are no literal issues (discriminator matched), this is likely the intended type
    const score = literalIssues === 0 ? otherIssues : literalIssues * 100 + otherIssues;

    if (score < bestScore) {
      bestScore = score;
      bestMatch = error;
    }
  }

  return bestMatch;
}

/**
 * Groups issues by their path prefix up to the specified depth.
 */
function groupIssuesByPath(
  issues: ZodIssue[],
  groupingDepth: number,
  pathRemapper?: (pathElements: (string | number)[]) => string,
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const issue of issues) {
    const groupPath = issue.path.slice(0, groupingDepth);
    const remainingPath = issue.path.slice(groupingDepth);

    const groupKey = pathRemapper
      ? (pathRemapper(groupPath) || '(root)')
      : (formatPath(groupPath) || '(root)');
    const remainingPathStr = formatPath(remainingPath);

    let message: string;
    if (remainingPathStr) {
      message = `${remainingPathStr}: ${issue.message}`;
    }
    else {
      message = issue.message;
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }

    // Avoid duplicate messages
    if (!grouped[groupKey].includes(message)) {
      grouped[groupKey].push(message);
    }
  }

  return grouped;
}

/**
 * Formats a path array into a dot-separated string.
 * Handles array indices by keeping them as-is (e.g., "items.0.name")
 */
function formatPath(path: (string | number)[]): string {
  return path.map(p => String(p)).join('.');
}

/**
 * Convenience function that returns a single formatted string.
 */
export function formatZodErrorAsString(
  error: z.ZodError,
  options: FormatZodErrorOptions = {},
): string {
  const formatted = formatZodError(error, options);

  return formatted
    .map((group) => {
      const pathPrefix = group.path === '(root)' ? '' : `${group.path}:\n`;
      const errors = group.errors.map(e => `  - ${e}`).join('\n');
      return `${pathPrefix}${errors}`;
    })
    .join('\n\n');
}
