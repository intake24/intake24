import { z } from 'zod';

import { bigIntString } from '../../common';

export const auditOps = ['INSERT', 'UPDATE', 'DELETE'] as const;
export type AuditOperation = (typeof auditOps)[number];

export const contextTypes = ['request', 'job'] as const;
export type ContextType = (typeof contextTypes)[number];

export const auditAttributes = z.object({
  id: z.uuidv7(),
  tableName: z.string().min(1),
  recordId: z.string().min(1).nullable(),
  operation: z.enum(auditOps),
  changedAt: z.date(),
  ctxType: z.enum(contextTypes).nullable(),
  ctxId: z.uuidv7().nullable(),
  ctxUserId: bigIntString.nullable(),
  oldValue: z.record(z.string(), z.json()).nullable(),
  newValue: z.record(z.string(), z.json()).nullable(),
});

export type AuditAttributes = z.infer<typeof auditAttributes>;
export type AuditJsonValue = z.infer<typeof auditAttributes.shape.oldValue> | z.infer<typeof auditAttributes.shape.newValue>;

export const auditEntry = auditAttributes.extend({
  user: z.object({
    id: bigIntString,
    name: z.string().min(1).nullable(),
  }).nullable(),
});
export type AuditEntry = z.infer<typeof auditEntry>;

export const auditHistory = z.partialRecord(z.enum(['foods', 'system']), z.array(auditEntry));
export type AuditHistory = z.infer<typeof auditHistory>;
