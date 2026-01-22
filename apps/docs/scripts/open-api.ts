import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import convert from '@openapi-contrib/json-schema-to-openapi-schema';
import { generateOpenApiAsync } from '@ts-rest/open-api';
import { z } from 'zod';
import contract from '@intake24/common/contracts';
import pkg from '../package.json';

async function main() {
  const document = await generateOpenApiAsync(
    contract,
    {
      info: {
        title: 'Intake24 API Reference',
        description: pkg.description,
        license: {
          name: pkg.license,
          url: 'https://opensource.org/license/apache-2-0',
        },
        version: pkg.version,
      },
      servers: [
        {
          url: 'https://api.example.com',
          description: 'Intake24 API instance',
        },
      ],
      components: {
        securitySchemes: {
          bearerHttpAuthentication: {
            description: 'Bearer token using a JWT',
            type: 'http',
            scheme: 'Bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    {
      schemaTransformer: async ({ schema }) => {
        // @ts-expect-error -- schemas do not conform to ZodType
        if (schema && 'toJSONSchema' in schema /* schema instanceof z.ZodAny */) {
          // @ts-expect-error -- schemas do not conform to ZodType
          const jsonSchema = z.toJSONSchema(schema, {
            target: 'openapi-3.0',
            unrepresentable: 'any',
            reused: 'ref',
            cycles: 'ref',

          });
          return await convert(jsonSchema);
        }
        return null;
      },
    },
  );

  writeFileSync(
    resolve('public', 'open-api.json'),
    JSON.stringify(document, null, 2),
    'utf8',
  );
}

main().catch((err) => {
  console.error(err);

  process.exitCode = process.exitCode ?? 1;
  process.exit();
});
