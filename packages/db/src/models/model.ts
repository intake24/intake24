import type { AbstractDataType, CountOptions, FindOptions } from 'sequelize';
/* eslint-disable ts/no-empty-object-type */
import { Readable } from 'node:stream';
import { snakeCase } from 'lodash-es';
import { cast, col, DataTypes, fn, Op, where } from 'sequelize';
import { Model as BaseModel } from 'sequelize-typescript';
import type { Pagination, PaginationMeta } from '@intake24/common/types/http';

export type PaginateQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
};

export type PaginateTransform = (item: any) => any;

export interface PaginateOptions<TAttributes = any, T extends PaginateTransform = any>
  extends FindOptions<TAttributes> {
  query: PaginateQuery;
  columns?: string[];
  transform?: T;
  topCount?: boolean;
}

// Sequelize options not indexable
export interface BaseCountOptions<TAttributes = any> extends CountOptions<TAttributes> {
  [key: string]: any;
}

export interface BaseFindOptions<TAttributes = any> extends FindOptions<TAttributes> {
  [key: string]: any;
}

export interface StreamFindOptions<TAttributes = any> extends FindOptions<TAttributes> {
  batchSize?: number;
  transform?: (item: any) => any;
}

export type BaseModelCtor<M extends Model = Model> = typeof Model & { new (): M };
export type BaseModelStatic<M extends Model = Model> = { new (): M };

export default class Model<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> extends BaseModel<TModelAttributes, TCreationAttributes> {
  public static op(op: 'ciEq') {
    const isPostgres = this.sequelize?.getDialect() === 'postgres';

    const ops = {
      ciEq: isPostgres ? Op.iLike : Op.eq,
    };

    return ops[op];
  }

  /**
   * Paginate results of Model.findAll
   *
   * @static
   * @template T
   * @template R
   * @param {BaseModelStatic<R extends Model ? R : Model>} this
   * @param {PaginateOptions<any, T>} { query, columns = [], transform, ...params }
   * @returns {Promise<Pagination<T extends PaginateTransform ? ReturnType<T> : R>>}
   * @memberof Model
   */
  public static async paginate<T extends PaginateTransform, R = Model>(
    this: BaseModelStatic<R extends Model ? R : Model>,
    { query, columns = [], transform, topCount, ...params }: PaginateOptions<any, T>,
  ): Promise<Pagination<T extends PaginateTransform ? ReturnType<T> : R>> {
    const { page = 1, limit = 50, sort, search } = query;

    const offset = limit * (page - 1);
    const options: BaseFindOptions = { limit, offset, ...params };

    // TODO: fix with sequelize types
    const model = this as BaseModelCtor<R extends Model ? R : Model>;

    if (search && columns.length) {
      const operation
        = model.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const operations = columns.map(column => where(cast(col(`${model.name}.${snakeCase(column)}`), 'text'), operation));
      // @ts-expect-error where merge types (watch out what is being merged, might not cover all permutations)
      options.where = { [Op.and]: [options.where, { [Op.or]: operations }] };
    }

    const countOptions = Object.keys(options).reduce<BaseCountOptions>((acc, key) => {
      // TODO: we should scan the where clause for include clauses instead
      if (topCount && key === 'include')
        return acc;

      if (!['order', 'attributes', 'limit', 'offset'].includes(key))
        acc[key] = options[key];

      return acc;
    }, {});

    const total = await model.unscoped().count(countOptions);

    if (sort && typeof sort === 'string') {
      const [column, order = 'ASC'] = sort.split('|');
      const attributes = model.getAttributes();
      if (column && Object.keys(attributes).includes(column)) {
        options.order = [DataTypes.STRING.key, DataTypes.TEXT.key].includes(
          (attributes[column]?.type as AbstractDataType).key,
        )
          ? [[fn('lower', col(`${model.name}.${snakeCase(column)}`)), order]]
          : [[snakeCase(column), order]];
      }
    }

    const records = await model.findAll(options);

    const data = transform ? records.map(transform) : records;

    const meta: PaginationMeta = {
      from: offset + 1,
      lastPage: Math.ceil(total / limit),
      page,
      path: '',
      limit,
      to: offset + limit,
      total,
    };

    return { data, meta };
  }

  /**
   * Batch-like stream helpers
   * based on https://github.com/nkovalenko93/sequelize-stream
   * and adopted for TS codebase
   */

  /**
   * Helper for streamed Model.findAll
   *
   * @static
   * @template M
   * @param {BaseModelCtor<M>} this
   * @param {Readable} inputStream
   * @param {StreamFindOptions<M['_attributes']>} options
   * @returns {Promise<void>}
   * @memberof Model
   */
  public static async performSearch<M extends Model<M>>(
    this: BaseModelCtor<M>,
    inputStream: Readable,
    options: StreamFindOptions<M['_attributes']>,
  ): Promise<void> {
    const {
      batchSize = 100,
      limit,
      offset: startOffset = 0,
      include,
      transform,
      attributes,
      ...params
    } = options;

    try {
      const max = limit ?? (await this.count(params));

      const offsets = [];
      let start = startOffset;

      while (start < max) {
        offsets.push(start);
        start += batchSize;
      }

      for (const offset of offsets) {
        const difference = batchSize + offset - max;
        const items = await this.findAll<M>({
          ...params,
          attributes,
          include,
          offset,
          limit: difference > 0 ? batchSize - difference : batchSize,
        });

        if (transform) {
          for (const item of items) {
            const transformedItem = await transform(item);
            inputStream.push(transformedItem);
          }
        }
        else {
          items.forEach(item => inputStream.push(item));
        }
      }

      inputStream.push(null);
    }
    catch (err) {
      inputStream.destroy(err instanceof Error ? err : undefined);
    }
  }

  /**
   * Streamed Model.findAll
   *
   * @static
   * @template M
   * @param {BaseModelStatic<M>} this
   * @param {StreamFindOptions<M['_attributes']>} [options]
   * @returns {Readable}
   * @memberof Model
   */
  public static findAllWithStream<M extends Model = Model>(
    this: BaseModelStatic<M>,
    options: StreamFindOptions<M['_attributes']> = {},
  ): Readable {
    // TODO: fix with sequelize types
    const model = this as BaseModelCtor<M>;

    const inputStream = new Readable({ objectMode: true });
    inputStream._read = () => {};
    model.performSearch(inputStream, options);

    return inputStream;
  }
}
