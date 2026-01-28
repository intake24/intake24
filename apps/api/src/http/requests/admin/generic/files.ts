import type { ParamSchema } from 'express-validator';

import { customTypeErrorMessage } from '@intake24/api/http/requests/util';

const allowedImageTypes = ['image/jpeg', 'image/png'] as const;

export const imageFile: ParamSchema = {
  in: ['body'],
  custom: {
    options: async (value, meta): Promise<void> => {
      const { file } = meta.req;
      if (!file)
        throw new Error(customTypeErrorMessage('file._', meta));

      if (file.mimetype.toLowerCase() in allowedImageTypes) {
        throw new Error(
          customTypeErrorMessage('file.mime', meta, { mime: allowedImageTypes.join(', ') }),
        );
      }
    },
  },
};
