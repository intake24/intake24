import { pick } from 'lodash-es';

export type ValidationError = {
  location: string;
  msg: string;
  path: string;
  type: string;
  value: string;
};

export type ValidationErrors = Record<string, ValidationError>;

export class Errors {
  private errors: ValidationErrors;

  constructor() {
    this.errors = {};
  }

  get(field: string, index?: number): string[] {
    if (typeof index === 'undefined')
      return [this.errors[field]?.msg].filter(Boolean) as string[];

    return Object.entries(this.errors).reduce<string[]>((acc, [key, value]) => {
      if (key.startsWith(`${field}.${index}.`))
        acc.push(value.msg);

      return acc;
    }, []);
  }

  has(field: string, index?: number): boolean {
    if (typeof index === 'undefined')
      return Object.prototype.hasOwnProperty.call(this.errors, field);

    return Object.keys(this.errors).some(
      key => key === field || key.startsWith(`${field}.${index}.`),
    );
  }

  all(): ValidationErrors {
    return this.errors;
  }

  getErrors(field?: string[]): ValidationError[] {
    if (!field)
      return Object.values(this.errors);

    return Object.values(pick(this.errors, field));
  }

  record(errors?: ValidationErrors): void {
    if (typeof errors !== 'undefined')
      this.errors = errors;
  }

  clear(field?: string | string[]): void {
    if (Array.isArray(field)) {
      field.forEach(item => delete this.errors[item]);
      return;
    }

    if (field) {
      const { [field]: discard, ...rest } = this.errors;
      this.errors = { ...rest };
      return;
    }

    this.errors = {};
  }

  any(): boolean {
    return !!Object.keys(this.errors).length;
  }
}
