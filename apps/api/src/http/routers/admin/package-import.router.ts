import { initServer } from '@ts-rest/express';
import multer from 'multer';
import { permission } from '@intake24/api/http/middleware';
import ioc from '@intake24/api/ioc';
import { contract } from '@intake24/common/contracts';

export function packageImport() {
  const upload = multer({ dest: ioc.cradle.fsConfig.local.uploads });

  return initServer().router(contract.admin.packageImport, {
    upload: {
      middleware: [permission('import-package'), upload.single('file')],
      handler: async () => {
        return { status: 202, body: { importToken: 'hello' } };
      },
    },
    import: {
      middleware: [permission('import-package')],
      handler: async () => {
        return { status: 202, body: undefined };
      },
    },
  });
}
