import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

// Safely extend Zod with OpenAPI helpers if compatible.
// In environments using Zod v4 (or where the plugin is incompatible),
// this will no-op to avoid runtime crashes when loading the module.
try {
  // Try standard extension; if the plugin references legacy Zod APIs, catch and ignore.
  extendZodWithOpenApi(z as any);
}
catch {
  // Ignore incompatibility and proceed without OpenAPI extensions.
}

export { z };
