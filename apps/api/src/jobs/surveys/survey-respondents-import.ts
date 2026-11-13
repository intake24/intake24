import type { Job } from 'bullmq';

import type { IoC } from '@intake24/api/ioc';
import type { CustomField } from '@intake24/common/types';

import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { parse } from 'fast-csv';
import fs from 'fs-extra';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';

import { batchGenerator } from '@intake24/api/util';
import { strongPasswordOptional, usernameSchema } from '@intake24/common/security';
import { normalizedEmail } from '@intake24/common/types';
import { User, UserSurveyAlias } from '@intake24/db';

import BaseJob from '../job';

const csvRow = z
  .intersection(
    z.object({
      username: usernameSchema,
      password: strongPasswordOptional.transform(val => val || undefined),
      name: z.string().max(512).optional().transform(val => val || undefined),
      email: normalizedEmail.optional().transform(val => val || undefined),
      phone: z.string().max(32).optional().transform(val => val || undefined),
    }),
    z.record(z.string(), z.string().transform(val => val || undefined)),
  )
  .refine(data => data.username !== data.password, {
    message: 'Username and password must not be the same',
    path: ['password'],
  });
export type CSVRow = z.infer<typeof csvRow>;

export default class SurveyRespondentsImport extends BaseJob<'SurveyRespondentsImport'> {
  readonly name = 'SurveyRespondentsImport';

  private readonly adminSurveyService;

  private file!: string;

  constructor({ logger, adminSurveyService }: Pick<IoC, 'logger' | 'adminSurveyService'>) {
    super({ logger });

    this.adminSurveyService = adminSurveyService;
  }

  /**
  /**
   * Run the task
   *
   * @param {Job} job
   * @returns {Promise<void>}
   * @memberof SurveyRespondentsImport
   */
  public async run(job: Job): Promise<void> {
    this.init(job);

    this.file = path.resolve(this.params.file);

    this.logger.debug('Job started.');

    const fileExists = await fs.pathExists(this.file);
    if (!fileExists)
      throw new Error(`Missing file (${this.file}).`);

    await this.validate();
    await this.import();

    this.logger.debug('Job finished.');
  }

  private async validate(chunk = 5): Promise<void> {
    let totalProcessed = 0;
    const readStream = createReadStream(this.file);
    const csvStream = parse({ headers: true, trim: true });

    await pipeline(
      readStream,
      csvStream,
      async (source: AsyncIterable<CSVRow>) => {
        for await (const batch of batchGenerator(source, chunk)) {
          await this.validateChunk(batch, totalProcessed);
          totalProcessed += batch.length;
        }
      },
    );
  }

  private async validateChunk(data: CSVRow[], offset: number): Promise<void> {
    const result = csvRow.array().safeParse(data);

    if (!result.success) {
      throw fromError({
        ...result.error,
        issues: result.error.issues.map(issue =>
          ({
            ...issue,
            path: issue.path.map(p => typeof p === 'number'
              ? p + offset
              : p),
          })),
      });
    }

    const username = result.data.map(item => item.username);
    const { surveyId } = this.params;

    // Check for unique aliases within survey
    const aliases = await UserSurveyAlias.findAll({
      attributes: ['username'],
      where: { surveyId, username },
    });
    if (aliases.length) {
      const existingAliases = aliases.map(alias => alias.username);
      throw new Error(`Following usernames already exist in survey: ${existingAliases.join(', ')}`);
    }

    // Check for unique emails within system
    const email = result.data.filter(item => item.email).map(item => item.email) as string[];
    if (email.length) {
      const users = await User.findAll({
        attributes: ['email'],
        where: { email },
      });

      if (users.length) {
        const existingUsers = users.map(user => user.email);
        throw new Error(`Following emails already exist in system: ${existingUsers.join(', ')}`);
      }
    }
  }

  private async import(chunk = 100): Promise<void> {
    const readStream = createReadStream(this.file);
    const csvStream = parse({ headers: true, trim: true });

    await pipeline(
      readStream,
      csvStream,
      async (source: AsyncIterable<CSVRow>) => {
        for await (const batch of batchGenerator(source, chunk)) {
          await this.importChunk(batch);
        }
      },
    );
  }

  private async importChunk(data: CSVRow[]): Promise<void> {
    const records = data.map((item) => {
      const { username, password, name, email, phone, ...rest } = item;

      const customFields = Object.keys(rest).reduce<CustomField[]>((acc, key) => {
        const value = rest[key];
        if (value)
          acc.push({ name: key, value });

        return acc;
      }, []);

      return {
        username,
        password,
        name,
        email,
        phone,
        customFields,
      };
    });

    await this.adminSurveyService.createRespondents(this.params.surveyId, records);
    await this.incrementProgress(data.length);
  }
}
