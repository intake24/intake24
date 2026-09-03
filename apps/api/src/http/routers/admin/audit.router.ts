import { initServer } from '@ts-rest/express';

import { contract } from '@intake24/common/contracts';

const subResourceMap: Record<string, string> = {
  categories: 'food-list',
  foods: 'food-list',
};

export function audit() {
  return initServer().router(contract.admin.audit, {
    resource: {
      handler: async ({ params, req }) => {
        const { resource, resourceId } = params;
        const { aclService, auditService } = req.scope.cradle;

        await aclService.checkAccess(resource, 'audit', { where: { id: resourceId } });

        const history = await auditService.getAuditHistory(resource, resourceId);

        return { status: 200, body: history };
      },
    },
    subResource: {
      handler: async ({ params, req }) => {
        const { resource, resourceId, subResource, subResourceId } = params;
        const { aclService, auditService } = req.scope.cradle;

        await aclService.checkAccess(resource, subResourceMap[subResource] ?? 'audit', { where: { id: resourceId } });

        const history = await auditService.getAuditHistory(subResource, subResourceId);

        return { status: 200, body: history };
      },
    },
  });
}
