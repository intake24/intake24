import type { OptionalSearchQueryParameters } from '@intake24/api/food-index/search-query';
import type { IoC } from '@intake24/api/ioc';
import type { InheritableAttributes } from '@intake24/api/services/foods/types/inheritable-attributes';
import type { FoodSearchResponse } from '@intake24/common/types/http';

import { GoogleGenAI } from '@google/genai';

import foodIndex from '@intake24/api/food-index';
import { applyDefaultSearchQueryParameters } from '@intake24/api/food-index/search-query';

// const ATTR_USE_ANYWHERE = 0;
const ATTR_AS_REGULAR_FOOD_ONLY = 1;
const ATTR_AS_RECIPE_INGREDIENT_ONLY = 2;

function foodSearchService({
  inheritableAttributesService,
  foodThumbnailImageService,
  cache,
  cacheConfig,
  logger: globalLogger,
}: Pick<IoC, 'inheritableAttributesService' | 'foodThumbnailImageService' | 'cache' | 'cacheConfig' | 'logger'>) {
  const logger = globalLogger.child({ service: 'FoodSearchService' });

  function acceptForQuery(recipe: boolean, attrOpt?: number): boolean {
    const attr = attrOpt ?? ATTR_AS_REGULAR_FOOD_ONLY;

    switch (attr) {
      case ATTR_AS_REGULAR_FOOD_ONLY:
        return !recipe;
      case ATTR_AS_RECIPE_INGREDIENT_ONLY:
        return recipe;
      default:
        return true;
    }
  }

  const resolveCategoryAttributes = async (categoryIds: string[]): Promise<Record<string, InheritableAttributes>> => {
    const data = await Promise.all(
      categoryIds.map(id => inheritableAttributesService.resolveCategoryAttributes(id)),
    );

    return Object.fromEntries(categoryIds.map((id, index) => [id, data[index]]));
  };

  const resolveFoodAttributes = async (foodIds: string[]): Promise<Record<string, InheritableAttributes>> => {
    const data = await Promise.all(
      foodIds.map(id => inheritableAttributesService.resolveFoodAttributes(id)),
    );

    return Object.fromEntries(foodIds.map((id, index) => [id, data[index]]));
  };

  const getCategoryAttributes = async (categoryIds: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(categoryIds, 'category-attributes', cacheConfig.ttl, resolveCategoryAttributes);
  };

  const getFoodAttributes = async (foodIds: string[]): Promise<Record<string, InheritableAttributes | null>> => {
    return cache.rememberMany(foodIds, 'food-attributes', cacheConfig.ttl, resolveFoodAttributes);
  };

  const search = async (localeId: string, description: string, isRecipe: boolean, options: OptionalSearchQueryParameters): Promise<FoodSearchResponse> => {
    const queryParameters = applyDefaultSearchQueryParameters(localeId, description, options);
    const results = await foodIndex.search(queryParameters);

    const catIds = results.categories.map(({ id }) => id);
    const foodIds = results.foods.map(({ id }) => id);

    const [categoryAttrs, foodAttrs, thumbnailImages] = await Promise.all([
      getCategoryAttributes(catIds),
      getFoodAttributes(foodIds),
      foodThumbnailImageService.resolveImages(foodIds),
    ]);

    const withFilteredIngredients = {
      foods: results.foods.reduce<FoodSearchResponse['foods']>((acc, food) => {
        if (!acceptForQuery(isRecipe, foodAttrs[food.id]?.useInRecipes))
          return acc;

        acc.push({ ...food, thumbnailImageUrl: thumbnailImages[food.id] });

        return acc;
      }, []),
      categories: results.categories.filter(category => acceptForQuery(isRecipe, categoryAttrs[category.id]?.useInRecipes)),
    };

    return withFilteredIngredients;
  };

  const getSearchHint = async (query: string, foodNames: string[]): Promise<string> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenAI({ apiKey });
      if (!apiKey) {
        logger.warn('GEMINI_API_KEY not configured');
        return '';
      }

      const prompt = `User searched for: "${query}"
Primary matches are found:
${foodNames.join(', ')}
<<<<<<< HEAD
Based on the query, primary matches and corresponding word distances, generate a brief, helpful tooltip (max 80 chars) to help the user refine their food search.
=======
Based on the query, primary matches and corresponding word distances, generate a brief, helpful tooltip hints (30 words max) to help the user refine their food search.
>>>>>>> a31d1df0f (fix(api): Use gemini-2.5-flash-lite to improve speed, instruction prompt improvement.)

- If results are poor (such as distance > 0.2), suggest specific food, or altering terms.
- If multiple similar results (such as distance among top 3 < 0.005), suggest adding details.
- If query is too short or generic, suggest being more descriptive.
- Be direct, polite and actionable, using simple language with suggestions.
- If results are good, respond with an empty hint.
- If query is not a food name, suggest using food names.
- Advise against typos or uncommon terms.
- Avoid mentioning distances or technical terms.

Query: pizza
Answer: You might want to specify the type of pizza or add toppings to narrow down your search.

Query: apple
Answer: Try adding more details like the variety of apple or whether you're looking for fresh or cooked options.

Query: car
Answer: It seems like "car" is not a food item. Please use food names to get relevant search results.

Query: Coca Coka
Answer: Is it possible you meant "Coca Cola"? Please check for typos or use common food and beverage names.

Now provide only the hint based on the above instructions.
Do NOT include the input prefix or output prefix.
`;
      logger.debug('Generating hint with LLM...');
      logger.debug(`Prompt: ${prompt}`);
      const resp: any = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      } as any);

      const text = resp?.candidates?.[0]?.content?.parts?.[0]?.text;
      logger.debug(`Hint: ${text}`);
      return text.trim();
    }
    catch (error) {
      if (error instanceof Error) {
        logger.error(`FoodSearchService error: ${error.message}`);
      }
      else {
        logger.error(`FoodSearchService error: ${JSON.stringify(error)}`);
      }
      return '';
    }
  };

  return {
    getFoodAttributes,
    search,
    getSearchHint,
  };
}

export default foodSearchService;

export type FoodSearchService = ReturnType<
  typeof foodSearchService
>;
