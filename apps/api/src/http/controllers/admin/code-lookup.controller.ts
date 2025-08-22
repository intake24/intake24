import type { Request, Response } from 'express';
import { ValidationError } from '@intake24/api/http/errors';
import type { IoC } from '@intake24/api/ioc';

function codeLookupController({ foodOrCategoryLookupService }: Pick<IoC, 'foodOrCategoryLookupService'>) {
  /**
   * GET /api/admin/code-lookup/:code
   * Check if a code is a food or category
   */
  const lookup = async (req: Request<{ code: string }>, res: Response): Promise<void> => {
    const { code } = req.params;

    if (!code) {
      throw new ValidationError('Code parameter is required');
    }

    const result = await foodOrCategoryLookupService.lookupCode(code);
    res.json(result);
  };

  /**
   * POST /api/admin/code-lookup/batch
   * Batch lookup for multiple codes
   */
  const batchLookup = async (req: Request<any, any, { codes: string[] }>, res: Response): Promise<void> => {
    const { codes } = req.body;

    if (!codes || !Array.isArray(codes)) {
      throw new ValidationError('Codes array is required');
    }

    const results = await foodOrCategoryLookupService.lookupCodes(codes);

    // Convert Map to object for JSON response
    const response = Object.fromEntries(results);

    res.json(response);
  };

  return {
    lookup,
    batchLookup,
  };
}

export default codeLookupController;
export type CodeLookupController = ReturnType<typeof codeLookupController>;
