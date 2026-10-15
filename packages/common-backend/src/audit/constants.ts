export const AUDIT_SCHEMA = 'public';
export const AUDIT_TABLE = 'audit_log';
export const AUDIT_TRIGGER = 'audit_trigger';
export const AUDIT_FUNCTION = 'log_row_changes';
export const JSONB_DIFF_FUNCTION = 'jsonb_diff';

export const AUDIT_EXCLUDE_TABLES = {
  foods: [AUDIT_TABLE, 'sequelize_meta'],
  system: [AUDIT_TABLE, 'sequelize_meta'],
};
