import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { formatZodError, formatZodErrorAsString } from './format-zod-error';

describe('formatZodError', () => {
  describe('basic error formatting', () => {
    it('formats simple required field errors', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const input = {};
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, schema, input);
        expect(formatted).toHaveLength(2);
        expect(formatted.map(f => f.path)).toContain('name');
        expect(formatted.map(f => f.path)).toContain('age');
      }
    });

    it('formats nested field errors', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      const input = { user: { profile: {} } };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, schema, input);
        expect(formatted).toHaveLength(1);
        expect(formatted[0]?.path).toBe('user.profile.name');
      }
    });
  });

  describe('grouping depth', () => {
    it('groups errors by path prefix with groupingDepth', () => {
      const schema = z.object({
        items: z.array(z.object({
          name: z.string(),
          value: z.number(),
        })),
      });

      const input = {
        items: [
          { name: 123, value: 'not a number' },
        ],
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Group by depth 2 (items.0)
        const formatted = formatZodError(result.error, schema, input, { groupingDepth: 2 });
        expect(formatted).toHaveLength(1);
        expect(formatted[0]?.path).toBe('items.0');
        expect(formatted[0]?.errors).toHaveLength(2);
        expect(formatted[0]?.errors.some(e => e.includes('name'))).toBe(true);
        expect(formatted[0]?.errors.some(e => e.includes('value'))).toBe(true);
      }
    });

    it('groups multiple array items separately', () => {
      const schema = z.object({
        items: z.array(z.object({
          name: z.string(),
        })),
      });

      const input = {
        items: [
          { name: 123 },
          { name: 456 },
        ],
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, schema, input, { groupingDepth: 2 });
        expect(formatted).toHaveLength(2);
        expect(formatted.map(f => f.path)).toContain('items.0');
        expect(formatted.map(f => f.path)).toContain('items.1');
      }
    });

    it('uses pathRemapper to provide custom path strings', () => {
      const foods = [
        { code: 'APPLE', name: 'Apple' },
        { code: 'BANANA', name: 'Banana' },
      ];

      const schema = z.object({
        foods: z.array(z.object({
          name: z.string(),
          weight: z.number(),
        })),
      });

      const input = {
        foods: [
          { name: 'Apple', weight: 'not a number' },
          { name: 123, weight: 100 },
        ],
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, schema, input, {
          groupingDepth: 2,
          pathRemapper: (pathElements) => {
            if (pathElements[0] === 'foods' && pathElements[1] !== undefined) {
              const index = Number(pathElements[1]);
              const foodCode = foods[index]?.code || `unknown`;
              return `Food "${foodCode}"`;
            }
            return pathElements.join('.');
          },
        });

        expect(formatted).toHaveLength(2);
        expect(formatted.map(f => f.path)).toContain('Food "APPLE"');
        expect(formatted.map(f => f.path)).toContain('Food "BANANA"');
      }
    });
  });

  describe('discriminated union handling', () => {
    it('formats discriminated union errors with clear message', () => {
      const catSchema = z.object({
        type: z.literal('cat'),
        meows: z.boolean(),
      });

      const dogSchema = z.object({
        type: z.literal('dog'),
        barks: z.boolean(),
      });

      const animalSchema = z.discriminatedUnion('type', [catSchema, dogSchema]);

      const input = { type: 'bird', feathers: true };
      const result = animalSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, animalSchema, input);
        expect(formatted).toHaveLength(1);
        // Should mention the expected values
        const errorMessage = formatted[0]?.errors[0] || '';
        expect(errorMessage).toContain('cat');
        expect(errorMessage).toContain('dog');
      }
    });

    it('handles portion size method-like discriminated unions', () => {
      const asServedSchema = z.object({
        method: z.literal('as-served'),
        servingImageSet: z.string(),
      });

      const guideImageSchema = z.object({
        method: z.literal('guide-image'),
        guideImageId: z.string(),
      });

      const standardPortionSchema = z.object({
        method: z.literal('standard-portion'),
        units: z.array(z.string()),
      });

      const portionSizeMethodSchema = z.discriminatedUnion('method', [
        asServedSchema,
        guideImageSchema,
        standardPortionSchema,
      ]);

      const input = {
        method: 'invalid-method',
        servingImageSet: 'test',
      };
      const result = portionSizeMethodSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, portionSizeMethodSchema, input);
        expect(formatted).toHaveLength(1);
        const errorMessage = formatted[0]?.errors[0] || '';
        expect(errorMessage).toContain('as-served');
        expect(errorMessage).toContain('guide-image');
        expect(errorMessage).toContain('standard-portion');
      }
    });

    it('shows field errors when discriminator is valid but other fields fail', () => {
      // Using z.union (not z.discriminatedUnion) to test the complex error handling
      const asServedSchema = z.object({
        method: z.literal('as-served'),
        servingImageSet: z.string().min(1),
        leftoversImageSet: z.string().optional(),
      });

      const guideImageSchema = z.object({
        method: z.literal('guide-image'),
        guideImageId: z.string().min(1),
      });

      // Using z.union triggers the invalid_union error structure
      const portionSizeMethodSchema = z.union([
        asServedSchema,
        guideImageSchema,
      ]);

      // Valid discriminator 'as-served' but missing required field
      const input = {
        method: 'as-served',
        // servingImageSet is missing
      };
      const result = portionSizeMethodSchema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, portionSizeMethodSchema, input);
        expect(formatted).toHaveLength(1);
        const errorMessage = formatted[0]?.errors[0] || '';
        // Should NOT say "Invalid discriminator value"
        expect(errorMessage).not.toContain('Invalid discriminator value');
        // Should explain why 'as-served' is not valid
        expect(errorMessage).toContain('as-served');
        expect(errorMessage).toContain('is not valid because');
        expect(errorMessage).toContain('servingImageSet');
      }
    });
  });

  describe('formatZodErrorAsString', () => {
    it('returns a formatted string with all errors', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const input = { name: 123, email: 'not-an-email' };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrorAsString(result.error, schema, input);
        expect(typeof formatted).toBe('string');
        expect(formatted).toContain('name');
        expect(formatted).toContain('email');
      }
    });

    it('formats grouped errors with path prefix', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
      });

      const input = { user: {} };
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrorAsString(result.error, schema, input, { groupingDepth: 1 });
        expect(formatted).toContain('user:');
        expect(formatted).toContain('name');
        expect(formatted).toContain('age');
      }
    });
  });

  describe('union (non-discriminated) handling', () => {
    it('provides meaningful error for regular unions', () => {
      const schema = z.union([
        z.string(),
        z.number(),
      ]);

      const input = true;
      const result = schema.safeParse(input);
      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodError(result.error, schema, input);
        expect(formatted.length).toBeGreaterThan(0);
      }
    });
  });
});
