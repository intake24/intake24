import { NotFoundError } from '@intake24/api/http/errors';
import { StandardUnit } from '@intake24/db';

function localeService() {
  const getStandardUnits = async (localeId: string, code: string | string[]): Promise<StandardUnit[]> =>
    StandardUnit.findAll({
      where: { code, localeId },
      attributes: ['code', 'name', 'icon', 'estimateIn', 'howMany'],
      order: [['code', 'ASC']],
    });

  const getStandardUnit = async (localeId: string, code: string): Promise<StandardUnit> => {
    const [standardUnit] = await getStandardUnits(localeId, code);

    if (!standardUnit)
      throw new NotFoundError('Standard unit not found.');

    return standardUnit;
  };

  return {
    getStandardUnit,
    getStandardUnits,
  };
}

export default localeService;

export type LocaleService = ReturnType<typeof localeService>;
