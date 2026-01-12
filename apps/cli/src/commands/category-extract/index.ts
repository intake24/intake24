import { createWriteStream } from 'node:fs';
import { Transform } from '@json2csv/node';
import { ApiClientV4, getApiClientV4EnvOptions } from '@intake24/api-client-v4';
import { logger as mainLogger } from '@intake24/common-backend';
import type { CategoryHeader } from '@intake24/common/types/http';

interface ExtractCategoriesOptions {
  outputPath: string;
}

type Row = {
  'Main category': string;
  'Subcategory 1': string;
  'Subcategory 2': string;
  'Subcategory 3': string;
  'Category code': string;
};

function createRow(level: 1 | 2 | 3, header: CategoryHeader): Row {
  const row: Row = {
    'Main category': '',
    'Subcategory 1': '',
    'Subcategory 2': '',
    'Subcategory 3': '',
    'Category code': header.code,
  };
  row[`Subcategory ${level}`] = header.name;

  return row;
}

class CategoryExtract {
  private readonly localeId: string;
  readonly writer;
  private readonly apiClient: ApiClientV4;

  constructor(localeId: string, outputPath: string, apiClient: ApiClientV4) {
    this.localeId = localeId;
    this.apiClient = apiClient;

    this.writer = new Transform(
      { fields: ['Main category', 'Subcategory 1', 'Subcategory 2', 'Subcategory 3', 'Category code'] },
      { },
      { objectMode: true },
    );
    const output = createWriteStream(outputPath, { encoding: 'utf8' });

    this.writer.pipe(output);
  }

  public async processCategory(level: number, header: CategoryHeader) {
    if (level > 3)
      throw new Error(`Did not expect nesting deeper than 3: ${header.code} (${header.name})`);

    this.writer.write(createRow(level as 1 | 2 | 3, header));

    const contents = await this.apiClient.categories.getCategoryContents(
      header.code,
      this.localeId,
    );

    for (const subheader of contents.subcategories) {
      await this.processCategory(level + 1, subheader);
      console.log(subheader);
    }
  }
}

export default async (localeId: string, options: ExtractCategoriesOptions): Promise<void> => {
  const logger = mainLogger.child({ service: 'Category extract' });
  const apiClient = new ApiClientV4(logger, getApiClientV4EnvOptions());

  const categories = await apiClient.categories.getRootCategories(localeId);

  const extract = new CategoryExtract(localeId, options.outputPath, apiClient);

  for (const header of categories.subcategories)
    await extract.processCategory(0, header);
};
