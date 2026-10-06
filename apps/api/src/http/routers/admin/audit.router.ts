import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';

const subResourceMap: Record<string, string> = {
  categories: 'food-list',
  foods: 'food-list',
};

export function audit() {
  return initServer().router(contract.admin.audit, {
    getSettings: {
      middleware: [permission('audit')],
      handler: async ({ req }) => {
        const tables = await req.scope.cradle.auditService.getAuditTables();

        return { status: 200, body: tables };
      },
    },
    saveSettings: {
      middleware: [permission('audit')],
      handler: async ({ body, req }) => {
        const tables = await req.scope.cradle.auditService.saveAuditTables(body);

        return { status: 200, body: tables };
      },
    },
    resource: {
      handler: async ({ params, req }) => {
        const { resource, resourceId } = params;
        const { aclService, auditService } = req.scope.cradle;

        await aclService.checkAccess(resource, 'audit', { where: { id: resourceId } });

        const log = await auditService.getAuditLog(resource, resourceId);

        return { status: 200, body: log };
      },
    },
    subResource: {
      handler: async ({ params, req }) => {
        const { resource, resourceId, subResource, subResourceId } = params;
        const { aclService, auditService } = req.scope.cradle;

        await aclService.checkAccess(resource, subResourceMap[subResource] ?? 'audit', { where: { id: resourceId } });

        const log = await auditService.getAuditLog(subResource, subResourceId);

        return { status: 200, body: log };
      },
    },
  });
}
