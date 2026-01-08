import type Suite from './integration-suite';
import { pick } from 'lodash-es';

import request from 'supertest';

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';

type Options = {
  bearer?: 'superuser' | 'user' | 'respondent' | null;
  code?: number;
  permissions?: string[];
  input?: any;
  result?: boolean;
  log?: boolean;
};

interface PaginatedOptions extends Omit<Options, 'result'> {
  result?: boolean | string;
}

function sharedTests(suite: typeof Suite) {
  const defaultOptions: Options = { bearer: 'user' };

  const assertMissingAuthentication = async (method: Method, url: string, ops?: Options) => {
    const { code = 401, input = {} } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    const { status } = await call.send(input);

    expect(status).toBe(code);
  };

  const assertMissingAuthorization = async (method: Method, url: string, ops?: Options) => {
    const { bearer, code = 403, input = {} } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');
    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);

    const { status } = await call.send(input);

    expect(status).toBe(code);
  };

  const assert401and403 = async (method: Method, url: string, ops?: Options) => {
    await assertMissingAuthentication(method, url);
    await suite.util.setPermission([]);
    await assertMissingAuthorization(method, url, ops);

    if (ops?.permissions?.length) {
      for (const permission of ops.permissions) {
        await suite.util.setPermission(permission);
        await assertMissingAuthorization(method, url, ops);
      }

      await suite.util.setPermission([]);
    }
  };

  const assertConflict = async (method: Method, url: string, ops?: Options) => {
    const { bearer, code = 409, input } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { status } = await call.send(input);

    expect(status).toBe(code);
  };

  const assertInvalidInput = async (
    method: Method,
    url: string,
    fields: string[],
    ops?: Options,
  ) => {
    const { bearer, code = 400, input = {} } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { status, body } = await call.send(input);

    expect(body).toContainAllKeys(['errors', 'message']);

    // This function fails to produce a useful error message for long key lists
    // expect(body.errors).toContainAllKeys(fields);

    const errorKeys = Object.keys(body.errors);
    const missing = fields.filter(field => !errorKeys.includes(field));
    const unexpected = errorKeys.filter(key => !fields.includes(key));

    const keyErrorMessages: string[] = [];

    if (missing.length > 0)
      keyErrorMessages.push(`Missing expected errors: ${missing.join(', ')}`);
    if (unexpected.length > 0)
      keyErrorMessages.push(`Unexpected errors: ${unexpected.join(', ')}`);

    if (keyErrorMessages.length > 0) {
      throw new Error(keyErrorMessages.join('\n\n'));
    }

    expect(status).toBe(code);
  };

  const assertMissingRecord = async (method: Method, url: string, ops?: Options) => {
    const { bearer, code = 404, input = {} } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { status } = await call.send(input);

    expect(status).toBe(code);
  };

  const assertPaginatedResult = async (method: Method, url: string, ops?: PaginatedOptions) => {
    const { bearer, code = 200, result } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');
    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);

    const { status, body } = await call.send();

    expect(body).toContainAllKeys(['data', 'meta']);
    expect(body.data).toBeArray();

    if (typeof result === 'boolean') {
      if (result)
        expect(body.data).not.toBeEmpty();
      else expect(body.data).toBeEmpty();
    }

    if (typeof result === 'string') {
      expect(body.data).not.toBeEmpty();

      const output = (body.data as { id: string }[]).find(item => item.id === result);
      expect(output).toBeTruthy();
    }

    expect(status).toBe(code);
  };

  const assertReferencesResult = async (
    method: Method,
    url: string,
    fields: string[],
    ops?: Options,
  ) => {
    const { bearer, code = 200 } = ops ?? defaultOptions;

    const call = request(suite.app)[method](url).set('Accept', 'application/json');
    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);

    const { status, body } = await call.send();

    expect(body).toContainAllKeys(fields);
    expect(status).toBe(code);
  };

  const assertAcknowledged = async (method: Method, url: string, ops?: Options) => {
    const { bearer, code = 200, input, result = false } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { body, status } = await call.send(input);

    if (result)
      expect(body).not.toBeEmpty();
    else expect(body).toBeEmpty();

    expect(status).toBe(code);
  };

  const assertBuffer = async (method: Method, url: string, ops?: Options) => {
    const { bearer, code = 200, input } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { body, status } = await call.send(input);

    expect(body).toBeInstanceOf(Buffer);
    expect(status).toBe(code);
  };

  const assertInstanceOf = async (method: Method, url: string, instance: any, ops?: Options) => {
    const { bearer, code = 200, input } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { body, status } = await call.send(input);

    expect(body).toBeInstanceOf(instance);
    expect(status).toBe(code);
  };

  const assertRecord = async (method: Method, url: string, output: any, ops?: Options) => {
    const { bearer, code = 200, input } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { body, status } = await call.send(input);

    if (typeof output === 'boolean') {
      if (output)
        expect(body).not.toBeEmpty();
      else expect(body).toBeEmpty();
    }
    else {
      expect(pick(body, Object.keys(output))).toEqual(output);
    }

    expect(status).toBe(code);
  };

  const assertRecordUpdated = async (method: Method, url: string, output: any, ops?: Options) => {
    const { bearer, code = 200, input = output } = { ...defaultOptions, ...ops };

    const call = request(suite.app)[method](url).set('Accept', 'application/json');

    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);
    const { body, status } = await call.send(input);

    expect(pick(body, Object.keys(output))).toEqual(output);
    expect(status).toBe(code);
  };

  const assertRecordInserted = async (method: Method, url: string, output: any, ops?: Options) => {
    await assertRecordUpdated(method, url, output, { code: 201, ...ops });
  };

  const assertRecordDeleted = async (method: Method, url: string, ops?: Options) => {
    const { bearer } = ops ?? defaultOptions;

    const call = request(suite.app)[method](url).set('Accept', 'application/json');
    if (bearer)
      call.set('Authorization', suite.bearer[bearer]);

    const { status, body } = await call.send();

    expect(body).toBeEmpty();
    expect(status).toBe(204);
  };

  return {
    assertMissingAuthentication,
    assertMissingAuthorization,
    assert401and403,
    assertConflict,
    assertInvalidInput,
    assertMissingRecord,
    assertPaginatedResult,
    assertReferencesResult,
    assertAcknowledged,
    assertBuffer,
    assertInstanceOf,
    assertRecord,
    assertRecordInserted,
    assertRecordUpdated,
    assertRecordDeleted,
  };
}

export default sharedTests;

export type SharedTests = ReturnType<typeof sharedTests>;
