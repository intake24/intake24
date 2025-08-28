export class PkgConstants {
  public static readonly IMAGE_DIRECTORY_NAME = 'images';
  public static readonly PORTION_SIZE_DIRECTORY_NAME = 'portion-size';
  public static readonly FOODS_FILE_NAME = 'foods.json';
  public static readonly GLOBAL_FOODS_FILE_NAME = 'global-foods.json';
  public static readonly CATEGORIES_FILE_NAME = 'categories.json';
  public static readonly GLOBAL_CATEGORIES_FILE_NAME = 'global-categories.json';
  public static readonly LOCALES_FILE_NAME = 'locales.json';
  public static readonly LOCAL_FOODS_FILE_NAME = 'local-foods.json';
  public static readonly LOCAL_CATEGORIES_FILE_NAME = 'local-categories.json';
  public static readonly ENABLED_LOCAL_FOODS_FILE_NAME = 'enabled-local-foods.json';
  public static readonly AS_SERVED_FILE_NAME = 'as-served.json';
  public static readonly GUIDE_IMAGE_FILE_NAME = 'guide-images.json';
  public static readonly IMAGE_MAP_FILE_NAME = 'image-maps.json';
  public static readonly DRINKWARE_FILE_NAME = 'drinkware.json';
  public static readonly PACKAGE_INFO_FILE_NAME = 'package.json';
  public static readonly NUTRIENT_TABLES_FILE_NAME = 'nutrient-tables.json';
  public static readonly PORTION_SIZE_IMAGE_LABELS_FILE_NAME = 'portion-size-image-labels.json';

  public static readonly CEREAL_BOWL_IMAGE_MAP = 'gbowl';
  public static readonly CEREAL_AS_SERVED_PREFIX = 'cereal_';
  public static readonly CEREAL_MILK_LEVEL_IMAGE_MAP_PREFIX = 'milkbowl';
  public static readonly CEREAL_AS_SERVED_LEFTOVERS_SUFFIX = '_leftovers';
  public static readonly CEREAL_BOWL_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

  public static readonly PIZZA_IMAGE_MAP = 'gpizza';
  public static readonly PIZZA_THICKNESS_IMAGE_MAP = 'gpthick';
  public static readonly PIZZA_SLICE_IMAGE_MAP_PREFIX = 'gpiz';
  public static readonly PIZZA_TYPES_COUNT = 9;
}
