import type { Job } from 'bullmq';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { parse } from 'fast-csv';
import fs from 'fs-extra';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import type { IoC } from '@intake24/api/ioc';
import { strongPasswordOptional } from '@intake24/common/security';
import type { CustomField } from '@intake24/common/types';
import { User, UserSurveyAlias } from '@intake24/db';
import StreamLockJob from '../stream-lock-job';

const csvRow = z.intersection(
  z.object({
    username: z.string().min(1).max(256),
    password: strongPasswordOptional.transform(val => val || undefined),
    name: z.string().max(512).optional().transform(val => val || undefined),
    email: z.string().max(512).email().toLowerCase().optional().transform(val => val || undefined),
    phone: z.string().max(32).optional().transform(val => val || undefined),
  }),
  z.record(z.string().transform(val => val || undefined)),
);

export type CSVRow = z.infer<typeof csvRow>;

export default class SurveyRespondentsImport extends StreamLockJob<'SurveyRespondentsImport'> {
  readonly name = 'SurveyRespondentsImport';

  private readonly adminSurveyService;

  private file!: string;

  private content: CSVRow[] = [];

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

    // await this.import();

    this.logger.debug('Job finished.');
  }

  /* async* validateChunk1(source: CsvParserStream<CSVRow, CSVRow>): AsyncGenerator<string> {
    for await (const chunk of source) {
      yield chunk.toString().toUpperCase();
    }
  } */

  private async validateChunk1(content: CSVRow[]): Promise<void> {
    if (!content.length)
      return;

    this.lock();

    const result = csvRow.array().safeParse(content);
    if (!result.success)
      throw fromError(result.error);

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
      const users = await User.findAll({ attributes: ['email'], where: { email } });

      if (users.length) {
        const existingUsers = users.map(user => user.email);
        throw new Error(`Following emails already exist in system: ${existingUsers.join(', ')}`);
      }
    }

    this.content = [];
    this.unlock();
  }

  async* collectChunk(source: any) {
    for await (const chunk of source) {
      console.warn(`yielding`, chunk);
      this.content.push(chunk);
      if (this.content.length === 100) {
        await this.validateChunk();
      }

      yield chunk;
    }
  }

  private async validate1(): Promise<void> {
    const stream = fs.createReadStream(this.file);
    const transform = parse({ headers: true, trim: true });

    await pipeline(
      stream,
      transform,
      this.collectChunk,
    );

    /* stream
      .on('end', (records: number) => {
        console.log(`ended: ${records}`);
      })
      .on('close', () => {
        console.log('closed');
      });

    for await (const row of stream) {
      console.log(row);
      this.content.push(row);
      if (this.content.length === chunk) {
        await this.validateChunk();
      }
    }

    await this.validateChunk(); */
  }

  /**
   * Read CSV file and validate in chunks
   *
   * @private
   * @param {number} [chunk]
   * @returns {Promise<void>}
   * @memberof SurveyRespondentsImport
   */
  private async validate(chunk = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(this.file);
      const transform = parse({ headers: true, trim: true });

      stream
        .on('data', () => {
          // No-op
          throw new Error('No-op');
        })
        .on('error', (err) => {
          console.error('validation Stream error', err);
          reject(err);
        })
        .on('close', () => {
          console.error('validation Stream closed', stream.destroyed);
        });

      transform
        .on('data', (row: CSVRow) => {
          this.content.push(row);

          if (chunk > 0 && this.content.length === chunk) {
            transform.pause();
            this.validateChunk()
              .then(() => {
                stream.resume();
              })
              .catch((err) => {
                transform.destroy(err);
                reject(err);
              });
          }
        })
        .on('end', async (records: number) => {
          this.initProgress(records);
          await this.waitForUnlock();

          console.error('validation transform end');

          this.validateChunk()
            .then(() => resolve())
            .catch((err) => {
              transform.destroy(err);
              reject(err);
            });
        })
        .on('error', err => reject(err))
        .on('close', () => {
          console.error('validation transform closed', transform.destroyed, stream.destroyed);
        });

      stream.pipe(transform);
    });
  }

  /**
   * Chunk validator. It validates:
   * - presence of required fields
   * - username / survey alias uniqueness within survey
   * - email uniqueness within system
   *
   * @private
   * @returns {Promise<void>}
   * @memberof SurveyRespondentsImport
   */
  private async validateChunk(): Promise<void> {
    if (!this.content.length)
      return;

    this.lock();

    const result = csvRow.array().safeParse(this.content);
    if (!result.success)
      throw fromError(result.error);

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
      const users = await User.findAll({ attributes: ['email'], where: { email } });

      if (users.length) {
        const existingUsers = users.map(user => user.email);
        throw new Error(`Following emails already exist in system: ${existingUsers.join(', ')}`);
      }
    }

    this.content = [];
    this.unlock();
  }

  /**
   * Read CSV file and import in chunks
   *
   * @private
   * @param {number} [chunk]
   * @returns {Promise<void>}
   * @memberof SurveyRespondentsImport
   */
  private async import(chunk = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(this.file).pipe(parse({ headers: true, trim: true }));

      stream
        .on('data', (row: CSVRow) => {
          this.content.push(row);

          if (chunk > 0 && this.content.length === chunk) {
            stream.pause();
            this.importChunk()
              .then(() => {
                stream.resume();
              })
              .catch((err) => {
                stream.destroy(err);
                reject(err);
              });
          }
        })
        .on('end', async () => {
          await this.waitForUnlock();

          console.error('import Stream end');
          this.logger.error('import stream end.');

          this.importChunk()
            .then(() => resolve())
            .catch((err) => {
              stream.destroy(err);
              reject(err);
            });
        })
        .on('error', err => reject(err))
        .on('close', () => {
          console.error('import Stream closed');
          this.logger.error('import stream closed.');
        });
    });
  }

  /**
   * Chunk importer
   *
   * @private
   * @returns {Promise<void>}
   * @memberof SurveyRespondentsImport
   */
  private async importChunk(): Promise<void> {
    if (!this.content.length)
      return;

    this.lock();

    const records = this.content.map((item) => {
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

    await this.incrementProgress(this.content.length);

    this.content = [];
    this.unlock();
  }
}
