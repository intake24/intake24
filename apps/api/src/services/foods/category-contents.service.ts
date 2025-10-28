import { NotFoundError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';
import type {
  CategoryContents,
  CategoryHeader,
  CategorySearch,
  FoodHeader,
} from '@intake24/common/types/http';
import type { FindOptions, FoodAttributes, PaginateQuery } from '@intake24/db';
import {
  Category,
  Food,
  getAllChildCategories,
  Op,
  QueryTypes,
} from '@intake24/db';

function categoryContentsService({
  adminCategoryService,
  db,
}: Pick<IoC, 'db' | 'adminCategoryService'>) {
  const filterUndefined = (
    headers: { id: string; code: string; name?: string | null }[],
  ): (CategoryHeader | FoodHeader)[] =>
    headers.filter(h => h.name).map(h => ({ id: h.id, code: h.code, name: h.name! }));

  const getRootCategories = async (localeCode: string): Promise<CategoryContents> => {
    const categories = await adminCategoryService.getRootCategories(localeCode);

    return {
      header: { id: '', code: '', name: 'Root' },
      foods: [],
      subcategories: categories
        .filter(({ hidden }) => !hidden)
        .map(({ id, code, name }) => ({ id, code, name })),
    };
  };

  const getCategoryHeader = async (localeCode: string, code: string): Promise<CategoryHeader> => {
    const category = await Category.findOne({
      where: { code, localeId: localeCode },
      attributes: ['id', 'code', 'name'],
    });

    if (!category)
      throw new NotFoundError(`Category ${code} not found`);

    return { id: category.id, code, name: category.name };
  };

  const getCategoryContents = async (localeCode: string, code: string): Promise<CategoryContents> => {
    const [header, categories, foods] = await Promise.all([
      getCategoryHeader(localeCode, code),
      Category.findAll({
        attributes: ['id', 'code', 'name'],
        where: { localeId: localeCode },
        include: [
          {
            association: 'parentCategories',
            through: { attributes: [] },
            attributes: ['code'],
            where: { code },
          },
        ],
      }),
      Food.findAll({
        attributes: ['id', 'code', 'name'],
        where: { localeId: localeCode },
        include: [
          {
            association: 'parentCategories',
            through: { attributes: [] },
            attributes: ['code'],
            where: { code },
          },
        ],
      }),
    ]);

    const foodHeaders = foods.map(({ id, code, name }) => ({ id, code, name }));
    const categoryHeaders = categories.map(({ id, code, name }) => ({ id, code, name }));

    return {
      header,
      foods: filterUndefined(foodHeaders).sort((a, b) => a.name.localeCompare(b.name)),
      subcategories: filterUndefined(categoryHeaders).sort((a, b) => a.name.localeCompare(b.name)),
    };
  };

  const searchCategory = async (localeCode: string, code: string, query: PaginateQuery): Promise<CategorySearch> => {
    const categories = await db.foods.query<{ id: string }>(getAllChildCategories, {
      type: QueryTypes.SELECT,
      replacements: { code },
      plain: false,
      raw: true,
    });

    const options: FindOptions<FoodAttributes> = {
      attributes: ['id', 'code', 'name'],
      where: { code, localeId: localeCode },
      include: [
        {
          attributes: ['categoryId'],
          association: 'parentCategoryMappings',
          where: { categoryId: categories.map(({ id }) => id) },
        },
      ],
      order: [['name', 'ASC']],
    };
    const { search } = query;

    if (search) {
      const op
        = Food.sequelize?.getDialect() === 'postgres'
          ? { [Op.iLike]: `%${search}%` }
          : { [Op.substring]: search };

      const ops = ['englishName', 'name'].map(column => ({ [column]: op }));

      options.where = { ...options.where, [Op.or]: ops };
    }

    return Food.paginate({
      query,
      ...options,
      transform: food => ({ id: food.id, code: food.code, name: food.name }),
    });
  };

  return {
    getCategoryContents,
    getCategoryHeader,
    getRootCategories,
    searchCategory,
  };
}

export default categoryContentsService;

export type CategoryContentsService = ReturnType<typeof categoryContentsService>;
