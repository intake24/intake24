# @intake24/food-tools

Food import and validation tools for Intake24.

## Overview

This package provides a comprehensive set of tools for importing, validating, and synchronizing food data between CSV files and the Intake24 database. It's designed as a separate microservice for maintaining food databases across different locales.

## Features

- **Import Foods**: Import food lists from CSV files with multi-locale support
- **Create Locale**: Provision locale metadata prior to importing foods
- **Verify Consistency**: Compare CSV source data against database state
- **Sync Foods**: Treat CSV as source of truth and synchronize to database
- **Validate Nutrients**: Batch validation of nutrient mappings before import
- **Cross-Check Import**: Validate import results against original CSV
- **Rollback Support**: Rollback failed imports using report files
- **Report Generation**: Generate reports in JSON, CSV, or Markdown formats
- **As-Served Package Builder**: Convert photo manifests into Intake24 v4 import packages

## Installation

```bash
pnpm add @intake24/food-tools
```

## Usage

### As a Library

```typescript
import {
  createLocaleCommand,
  importFoodsCommand,
  verifyConsistencyCommand,
  syncFoodsCommand
} from '@intake24/food-tools';

// Provision a locale
await createLocaleCommand({
  code: 'id_ID_2025',
  englishName: 'Indonesia 2025',
  localName: 'Indonesia 2025',
  respondentLanguageId: 'id',
  adminLanguageId: 'en',
  countryFlagCode: 'id',
  overwrite: true,
});

// Import foods from CSV
await importFoodsCommand({
  inputPath: 'foods.csv',
  localeId: 'jp_JP_2024',
  dryRun: false,
  // ... other options
});
```

### With Intake24 CLI

The commands can be integrated into the Intake24 CLI by importing from this package:

```typescript
import { importFoodsCommand } from '@intake24/food-tools';

program
  .command('import-foods')
  .action(async (options) => {
    await importFoodsCommand(options);
  });
```

### Generate As-Served Packages (Manifest Mode)

```typescript
import { generateAsServedPackageCommand } from '@intake24/food-tools';

await generateAsServedPackageCommand({
  manifestPath: 'reports/indonesia/food-photographs/Filepath_Indonesia_13112024.xlsx',
  outputPath: 'tmp/as-served-package',
  imageRoots: ['reports/indonesia/food-photographs'],
  cleanOutput: true,
});
```

This produces an Intake24 v4-compatible package directory that can be imported with:

```bash
pnpm --filter @intake24/cli cli import-package v4 tmp/as-served-package \
  --modules-for-execution as-served-images --on-conflict skip
```

### Generate As-Served Packages (Folder Mode)

```typescript
import { generateAsServedPackageCommand } from '@intake24/food-tools';

await generateAsServedPackageCommand({
  mode: 'folders',
  folderRoots: ['reports/indonesia/food-photographs/Japan images/AS SERVED'],
  outputPath: 'tmp/as-served-package-jp',
  setIdPrefix: 'jp_',
  trimSuffix: '_series',
  cleanOutput: true,
});
```

CLI equivalent:

```bash
pnpm --filter @intake24/cli cli generate-as-served-package \
  --mode folders \
  --folder-root "../../reports/indonesia/food-photographs/Japan images/AS SERVED" \
  --set-prefix jp_ \
  --trim-suffix _series \
  --output-path ../../tmp/as-served-package-jp \
  --clean-output
```

## Documentation

See the [docs](./docs) directory for detailed documentation:

### Getting Started

- [Getting Started Guide](./docs/GETTING-STARTED.md) - Setup and first import
- [Quick Reference](./docs/QUICK-REFERENCE.md) - Common commands and workflows

### Guides

- [CSV Template Guide](./docs/CSV-TEMPLATE-GUIDE.md) - CSV format specification and templates
- [Locale-Specific Guide](./docs/LOCALE-GUIDE.md) - Import guides for different locales
- [Japanese Food Import Guide](./docs/Japanese-Food-Import-Guide.md) - Detailed Japanese import workflow
- [CSV as Source of Truth](./docs/CSV-AS-SOURCE-OF-TRUTH.md) - Database synchronization concepts

### Technical Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - System design and data flow
- [API Integration Guide](./docs/API-INTEGRATION.md) - Programmatic usage
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) - Common issues and solutions

## License

Apache-2.0
