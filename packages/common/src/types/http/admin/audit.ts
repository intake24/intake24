import { z } from 'zod';

import { bigIntString, databaseTypes } from '../../common';

export const auditOps = ['INSERT', 'UPDATE', 'DELETE'] as const;
export type AuditOperation = (typeof auditOps)[number];

export const contextTypes = ['request', 'job'] as const;
export type ContextType = (typeof contextTypes)[number];

export const auditTableAttributes = z.object({
  id: z.string().min(1),
  exclude: z.string().min(1).array(),
});
export type AuditTableAttributes = z.infer<typeof auditTableAttributes>;

export const auditTablesResponse = z.record(z.enum(databaseTypes), z.array(auditTableAttributes));
export type AuditTablesResponse = z.infer<typeof auditTablesResponse>;

function auditDbTables(db: 'foods' | 'system') {
  return auditTableAttributes.array().refine(
    (tables) => {
      const tableNames = tables.map(t => t.id);
      return new Set(tableNames).size === tableNames.length;
    },
    { path: [db], message: 'Duplicate table names' },
  );
};

export const auditTablesRequest = z.object({
  foods: auditDbTables('foods'),
  system: auditDbTables('system'),
});
export type AuditTablesRequest = z.infer<typeof auditTablesRequest>;

export const auditLogAttributes = z.object({
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

export type AuditLogAttributes = z.infer<typeof auditLogAttributes>;
export type AuditJsonValue = z.infer<typeof auditLogAttributes.shape.oldValue> | z.infer<typeof auditLogAttributes.shape.newValue>;

export const auditEntry = auditLogAttributes.extend({
  user: z.object({
    id: bigIntString,
    name: z.string().min(1).nullable(),
  }).nullable(),
});
export type AuditEntry = z.infer<typeof auditEntry>;

export const auditLog = z.partialRecord(z.enum(databaseTypes), z.array(auditEntry));
export type AuditLog = z.infer<typeof auditLog>;
