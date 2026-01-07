/* eslint-disable perfectionist/sort-imports */
import './bootstrap';

import { Argument, Command, Option } from 'commander';

import buildFrAlbaneLocaleCommand from '@intake24/cli/commands/fr-albane/build-fr-albane-command';
import buildFrInca3LocaleCommand from '@intake24/cli/commands/fr-inca3/build-fr-locale-command';
import buildGoustoLocaleCommand from './commands/gousto/build-gousto-locale-command';
import buildUaeLocaleCommand from './commands/uae/build-uae-locale-command';
import {
  auditFoodListCommand,
  checkNutrientsCommand,
  convertReportCommand,
  createLocaleCommand,
  crossCheckImportCommand,
  exportTranslationsCommand,
  importFoodsCommand,
  rollbackImportCommand,
  syncFoodsCommand,
  validateNutrientsBatchCommand,
  verifyConsistencyCommand,
} from '@intake24/food-tools';
import convertDrinkScale from '@intake24/cli/commands/svg-converters/convert-drink-scale';
import convertImageMap from '@intake24/cli/commands/svg-converters/convert-image-map';
import pkg from '../package.json';

import {
  embeddingStats,
  extractCategories,
  findPortionImages,
  generateAsServedPackage,
  generateEmbeddings,
  generateEnv,
  generateKey,
  generateVapidKeys,
  hashPassword,
  mergeGeneratedSynonyms,
  migrateAltNames,
  opensearchMigrate,
  opensearchTest,
  packageExportV3,
  packageExportV4,
  packageImportV4,
  searchTest,
  syncFoodAttributes,
  validateEmbeddings,
  verifyAssociatedFoods,
} from './commands';
import {
  conflictResolutionOptions,
  importerSpecificModulesExecutionOptions,
} from './commands/packager/importer-v4';

async function run() {
  const program = new Command();

  program.name('Intake24 CLI');
  program.version(pkg.version);

  program
    .command('generate-env')
    .description('Generate .env files for each application with fresh secrets and keys.')
    .option('-f, --force', 'override existing .env files')
    .action(async (cmd) => {
      await generateEnv(cmd);
    });

  program
    .command('generate-key')
    .description('Generate random key with 64 chars default length.')
    .option('-l, --length [length]', 'key length', '64')
    .action(async (cmd) => {
      await generateKey(cmd);
    });

  program
    .command('generate-vapid-keys')
    .description('Generate VAPID key pair.')
    .action(async () => {
      await generateVapidKeys();
    });

  program
    .command('generate-as-served-package')
    .description(
      'Generate a v4-compatible as-served image package from either a manifest or a set of source folders.',
    )
    .option('--mode <mode>', 'Generation mode: manifest | folders', 'manifest')
    .option('--manifest-path <path>', 'Excel manifest path (e.g., Filepath_*.xlsx)')
    .requiredOption('--output-path <path>', 'Destination directory for the generated package')
    .option(
      '--images-root <path>',
      'Directory to search for as-served image folders (repeatable, manifest mode only)',
      (value: string, previous: string[]) => (previous ? [...previous, value] : [value]),
      [],
    )
    .option(
      '--folder-root <path>',
      'Folder containing as-served image subdirectories (repeatable, folders mode only)',
      (value: string, previous: string[]) => (previous ? [...previous, value] : [value]),
      [],
    )
    .option('--set-prefix <prefix>', 'Prefix to prepend to folder-derived set IDs')
    .option('--trim-suffix <suffix>', 'Suffix to trim from folder names before generating IDs')
    .option('--clean-output', 'Remove the output directory before generating the package')
    .option('--dry-run', 'Validate inputs without writing files')
    .option(
      '--no-overwrite-existing-images',
      'Preserve existing images in the output directory instead of replacing them',
    )
    .action(async (options) => {
      const mode = options.mode as 'manifest' | 'folders';
      const imageRoots: string[] | undefined
        = options.imagesRoot && options.imagesRoot.length > 0 ? options.imagesRoot : undefined;
      const folderRoots: string[] | undefined
        = options.folderRoot && options.folderRoot.length > 0 ? options.folderRoot : undefined;

      if (mode === 'manifest' && !options.manifestPath) {
        throw new Error('generate-as-served-package: --manifest-path is required in manifest mode');
      }

      if (mode === 'folders' && (!folderRoots || folderRoots.length === 0)) {
        throw new Error('generate-as-served-package: at least one --folder-root is required in folders mode');
      }

      await generateAsServedPackage({
        mode,
        manifestPath: options.manifestPath,
        outputPath: options.outputPath,
        imageRoots,
        folderRoots,
        setIdPrefix: options.setPrefix,
        trimSuffix: options.trimSuffix,
        cleanOutput: Boolean(options.cleanOutput),
        dryRun: Boolean(options.dryRun),
        overwriteExistingImages: options.overwriteExistingImages ?? true,
      });
    });

  const textDirectionOption = new Option(
    '--text-direction [direction]',
    'Text direction (ltr or rtl)',
  )
    .choices(['ltr', 'rtl'] as const)
    .default('ltr');

  const visibilityOption = new Option(
    '--visibility [visibility]',
    'Locale visibility (public or restricted)',
  )
    .choices(['public', 'restricted'] as const)
    .default('restricted');

  program
    .command('create-locale')
    .description('Create a locale record (optionally updating if it already exists)')
    .requiredOption('-c, --code [code]', 'Locale code / identifier (e.g., id_ID_2025)')
    .requiredOption('--english-name [name]', 'Locale English name')
    .requiredOption('--local-name [name]', 'Locale localised name')
    .requiredOption('--respondent-language [code]', 'Respondent language code (e.g., id)')
    .requiredOption('--admin-language [code]', 'Admin language code (e.g., en)')
    .requiredOption('--flag-code [code]', 'Country flag / locale code (e.g., id)')
    .option('-p, --prototype [code]', 'Prototype locale code')
    .addOption(textDirectionOption)
    .option('--food-index-language [code]', 'Food index language backend ID', 'en')
    .option('--food-index-enabled', 'Enable food index for this locale', false)
    .addOption(visibilityOption)
    .option('--overwrite', 'Update existing locale if one is found', false)
    .action(async (options) => {
      await createLocaleCommand({
        code: options.code,
        englishName: options.englishName,
        localName: options.localName,
        respondentLanguageId: options.respondentLanguage,
        adminLanguageId: options.adminLanguage,
        countryFlagCode: options.flagCode,
        prototypeLocaleId: options.prototype,
        textDirection: options.textDirection,
        foodIndexLanguageBackendId: options.foodIndexLanguage,
        foodIndexEnabled: options.foodIndexEnabled,
        visibility: options.visibility,
        overwrite: options.overwrite,
      });
    });

  program
    .command('hash-password')
    .description(
      'Generate a BCrypt password hash to create/update user passwords manually in the database.',
    )
    .argument('<password>', 'Plain text password to hash.')
    .action(async (pwd) => {
      await hashPassword(pwd);
    });

  program
    .command('find-portion-images')
    .description(
      'Find portion size images that represent the amount of food having energy value closest to the specified target value',
    )
    .requiredOption('-c, --config [path]', 'config file path')
    .requiredOption('-o, --output [path]', 'output file path')
    .action(async (pwd) => {
      await findPortionImages(pwd);
    });

  const skipFoodsOption = new Option(
    '--sf, --skip-foods [food-ids...]',
    'Skip foods having these codes (typically for debug purposes)',
  );

  skipFoodsOption.required = true;

  program
    .command('export-package')
    .description('Export food data into a portable format')
    .addArgument(new Argument('<version>', 'Intake24 API version').choices(['v3', 'v4']))
    .option(
      '--as, --as-served [set-ids...]',
      'Export as served portion size images for given set identifiers',
    )
    .addOption(skipFoodsOption)
    .requiredOption('--locale <locale-ids...>', 'Export all data for the given locale ids')
    .action(async (version, options) => {
      switch (version) {
        case 'v3':
          return await packageExportV3(version, options);
        case 'v4':
          return await packageExportV4(version, options);
        default:
          throw new Error(`Unexpected version option: ${version}`);
      }
    });

  const conflictResolutionOption = new Option(
    '--on-conflict [on-conflict-option]',
    'Conflict resolution strategy',
  ).choices(conflictResolutionOptions);

  const specificModulesExecutionOption = new Option(
    '--modules-for-execution [modules-for-execution-option...]',
    'Specific modules to execute',
  ).choices(importerSpecificModulesExecutionOptions);

  conflictResolutionOption.required = true;
  specificModulesExecutionOption.required = false;

  program
    .command('import-package')
    .description('Import food data from a portable format')
    .addArgument(new Argument('<version>', 'Intake24 API version').choices(['v3', 'v4']))
    .addArgument(new Argument('<package-file>', 'Input package file path'))
    .addOption(conflictResolutionOption)
    .addOption(specificModulesExecutionOption)
    .option('--append', 'Append enabled foods')
    .action(async (version, inputFilePath, options) => {
      switch (version) {
        case 'v3':
          throw new Error('Not implemented');
        case 'v4':
          await packageImportV4(version, inputFilePath, options);
          return;
        default:
          throw new Error(`Unexpected version option: ${version}`);
      }
    });

  program
    .command('extract-categories')
    .description('Generate a global category list')
    .argument('<locale>', 'Locale ID')
    .requiredOption('-o, --output-path [output path]', 'Output file path')
    .action(async (localeId, options) => {
      await extractCategories(localeId, options);
    });

  program
    .command('build-fr-locale')
    .description('Build French INCA3 locale')
    .requiredOption('-i, --input-path [input path]', 'Source file path')
    .requiredOption('-o, --output-path [output path]', 'Output file path')
    .action(async (options) => {
      await buildFrInca3LocaleCommand(options);
    });

  program
    .command('build-fr-albane')
    .description('Build French Albane locale')
    .requiredOption('-i, --input-path [input path]', 'Source file path')
    .requiredOption('-o, --output-path [output path]', 'Output file path')
    .action(async (options) => {
      await buildFrAlbaneLocaleCommand(options);
    });

  program
    .command('build-uae')
    .description('Build UAE (NYUAD) locale')
    .requiredOption('--sc, --source-locale-code [source locale code]', 'Source locale code')
    .requiredOption('--sp, --source-path [source path]', 'Source package directory')
    .requiredOption('--pc, --prototype-locale-code [prototype locale code]', 'Prototype locale code')
    .requiredOption('--pp, --prototype-path [prototype path]', 'Prototype package directory')
    .requiredOption('--fc, --fallback-locale-code [fallback locale code]', 'Fallback locale code')
    .requiredOption('--fp, --fallback-path [prototype path]', 'Fallback package directory')
    .requiredOption('--f2c, --fallback2-locale-code [fallback locale code]', 'Fallback 2 locale code')
    .requiredOption('--f2p, --fallback2-path [prototype path]', 'Fallback 2 package directory')
    .requiredOption('--f3c, --fallback3-locale-code [fallback locale code]', 'Fallback 3 locale code')
    .requiredOption('--f3p, --fallback3-path [prototype path]', 'Fallback 3 package directory')
    .requiredOption('-o, --output-path [output path]', 'Output package directory')
    .action(async (options) => {
      await buildUaeLocaleCommand(options);
    });

  const volumeMethodOption = new Option('-m, --volume-method [volume-method]', 'Volume estimation method')
    .choices(['lookUpTable', 'cylindrical']);

  volumeMethodOption.mandatory = true;

  program
    .command('convert-drink-scale')
    .description('Convert legacy SVG drink scale data to Intake24 package format')
    .requiredOption('--id, --set-id [set-id]', 'Drinkware set ID')
    .requiredOption('--description [description]', 'Drinkware set description')
    .requiredOption('--svg, --selection-svg [selection-svg]', 'Selection image map SVG')
    .requiredOption(
      '--img, --selection-base-image [selection-base-image]',
      'Selection image map base image',
    )
    .requiredOption('--scales-csv [scales-csv]', 'Drink scales description CSV')
    .requiredOption('-o, --output-dir [output-dir]', 'Output package directory')
    .addOption(volumeMethodOption)
    .requiredOption('--language [language]', 'Language code for labels and descriptions')
    .option(
      '--ow, --overwrite',
      'Overwrite existing records in destination package directory',
      false,
    )
    .action(async (options) => {
      await convertDrinkScale(options);
    });

  program
    .command('convert-image-map')
    .description('Convert legacy SVG image map data to Intake24 package format')
    .requiredOption('--id [image map ID]>', 'Image map ID')
    .requiredOption('--description [description]', 'Image map description')
    .requiredOption('--svg, --svg-path [SVG path]', 'Image map SVG')
    .requiredOption('--img, --base-image-path [base image path]', 'Image map base image')
    .requiredOption('-o, --output-dir [output directory]', 'Output package directory')
    .option(
      '--ow, --overwrite',
      'Overwrite existing records in destination package directory',
      false,
    )
    .action(async (options) => {
      await convertImageMap(options);
    });

  program
    .command('search-test')
    .description('Test search quality of the system')
    .requiredOption('--term <term>', 'Search term')
    .requiredOption('--path <path>', 'Jsonl file path')
    .action(async (cmd) => {
      await searchTest(cmd);
    });

  // Embedding management commands
  program
    .command('generate-embeddings')
    .description('Generate semantic embeddings for food items in a locale')
    .requiredOption('-l, --locale-id <locale>', 'Locale ID (e.g., jp_JP_2024)')
    .option('-b, --batch-size [size]', 'Batch size for processing', '50')
    .option('--dry-run', 'Show what would be processed without making changes', false)
    .option('--force', 'Regenerate existing embeddings', false)
    .action(async (cmd) => {
      await generateEmbeddings({
        localeId: cmd.localeId,
        batchSize: Number.parseInt(cmd.batchSize, 10),
        dryRun: cmd.dryRun,
        force: cmd.force,
      });
    });

  program
    .command('embedding-stats')
    .description('Show embedding statistics')
    .option('-l, --locale-id [locale]', 'Show stats for specific locale (omit for global stats)')
    .option('--detailed', 'Show detailed statistics', false)
    .action(async (cmd) => {
      await embeddingStats({
        localeId: cmd.localeId,
        detailed: cmd.detailed,
      });
    });

  program
    .command('validate-embeddings')
    .description('Validate embedding quality and consistency')
    .requiredOption('-l, --locale-id <locale>', 'Locale ID to validate')
    .option('-s, --sample-size [size]', 'Number of embeddings to validate', '100')
    .option('--fix-errors', 'Automatically fix found errors', false)
    .action(async (cmd) => {
      await validateEmbeddings({
        localeId: cmd.localeId,
        sampleSize: Number.parseInt(cmd.sampleSize, 10),
        fixErrors: cmd.fixErrors,
      });
    });

  program
    .command('build-gousto')
    .description('Build Gousto locale')
    .requiredOption('-s, --source-path [source file path]', 'Source file path (recipe drop CSV)')
    .requiredOption('-o, --output-path [output path]', 'Output package directory')
    .requiredOption('-l, --locale-id [locale ID]', 'Target locale ID')
    .requiredOption('-t, --thumbnail-dir [locale ID]', 'Food thumbnail image directory path')
    .action(async (options) => {
      await buildGoustoLocaleCommand(options);
    });

  program
    .command('import-foods')
    .description('Import food list to locale using API validation')
    .requiredOption('-i, --input-path [input path]', 'Food list CSV file path')
    .requiredOption('-l, --locale-id [locale ID]', 'Target locale ID (e.g., jp_JP_2024, en_GB, fr_FR)')
    .option('--dry-run', 'Validate and preview without importing', false)
    .option('-b, --batch-size [size]', 'Batch size for API requests', '10')
    .option('--skip-header-rows [rows]', 'Number of header rows to skip', '2')
    .option('--tags [tags...]', 'Additional tags to add to foods')
    .option('--food-group [id]', 'Default food group ID', '1')
    .option('--preset [preset]', 'Use preset configuration for specific locales', 'custom')
    .option('--skip-existing', 'Skip foods that already exist in the locale', false)
    .option('--skip-invalid-nutrients', 'Skip nutrient table mappings to avoid 500 errors', false)
    .option('--skip-associated-foods', 'Skip associated foods (for multi-pass import)', false)
    .option('--delete-action1-local', 'Delete local food records for action 1 foods', false)
    .option('--report-path [path]', 'Path to save import report')
    .option('--report-format [format]', 'Report format (csv, json, markdown)', 'json')
    .action(async (options) => {
      // Define presets for different locales
      const presets = {
        japan: {
          skipHeaderRows: 2,
          tags: ['japanese'],
          nutrientTableMapping: {
            AUSNUT: 'AUSNUT',
            STFCJ: 'STFCJ',
            'DCD for Japan': 'DCDJapan',
          },
        },
        uk: {
          skipHeaderRows: 1,
          tags: ['uk'],
          nutrientTableMapping: {
            NDNS: 'NDNS',
            McCance: 'MCCANCE',
          },
        },
        france: {
          skipHeaderRows: 1,
          tags: ['french'],
          nutrientTableMapping: {
            CIQUAL: 'CIQUAL',
            ANSES: 'ANSES',
          },
        },
        usa: {
          skipHeaderRows: 1,
          tags: ['usa'],
          nutrientTableMapping: {
            USDA: 'USDA',
            SR: 'USDA_SR',
          },
        },
        custom: {
          skipHeaderRows: Number.parseInt(options.skipHeaderRows, 10),
          tags: options.tags || [],
          nutrientTableMapping: {},
        },
      };

      const presetConfig = presets[options.preset as keyof typeof presets] || presets.custom;

      await importFoodsCommand({
        inputPath: options.inputPath,
        localeId: options.localeId,
        dryRun: options.dryRun,
        batchSize: Number.parseInt(options.batchSize, 10),
        skipHeaderRows: presetConfig.skipHeaderRows,
        tags: presetConfig.tags,
        defaultFoodGroup: options.foodGroup,
        nutrientTableMapping: presetConfig.nutrientTableMapping,
        skipExisting: options.skipExisting,
        skipInvalidNutrients: options.skipInvalidNutrients,
        skipAssociatedFoods: options.skipAssociatedFoods,
        deleteAction1Local: options.deleteAction1Local,
        reportPath: options.reportPath,
        reportFormat: options.reportFormat,
      });
    });

  // Enhanced import command with multi-pass support
  program
    .command('import-foods-mp')
    .description('Import food list with multi-pass processing for proper dependency handling')
    .requiredOption('-i, --input-path [input path]', 'Food list CSV file path')
    .requiredOption('-l, --locale-id [locale ID]', 'Target locale ID (e.g., jp_JP_2024)')
    .option('--dry-run', 'Validate and preview without importing', false)
    .option('-b, --batch-size [size]', 'Batch size for API requests', '10')
    .option('--skip-header-rows [rows]', 'Number of header rows to skip', '2')
    .option('--tags [tags...]', 'Additional tags to add to foods')
    .option('--food-group [id]', 'Default food group ID', '1')
    .option('--skip-existing', 'Skip foods that already exist in the locale', false)
    .option('--skip-invalid-nutrients', 'Skip nutrient table mappings to avoid 500 errors', false)
    .option('--skip-associations', 'Skip processing associations (for manual processing later)', false)
    .option('--multi-pass', 'Use multi-pass processing (default: true)', 'true')
    .option('--report-path [path]', 'Path to save import report')
    .option('--report-format [format]', 'Report format (csv, json, markdown)', 'json')
    .action(async (options) => {
      // Multi-pass import is now handled by the basic import command
      await importFoodsCommand({
        inputPath: options.inputPath,
        localeId: options.localeId,
        dryRun: options.dryRun,
        batchSize: Number.parseInt(options.batchSize, 10),
        skipHeaderRows: Number.parseInt(options.skipHeaderRows, 10),
        tags: options.tags || [],
        defaultFoodGroup: options.foodGroup,
        nutrientTableMapping: {}, // Custom mapping can be added if needed
        skipExisting: options.skipExisting,
        skipInvalidNutrients: options.skipInvalidNutrients,
        reportPath: options.reportPath,
        reportFormat: options.reportFormat,
      });
    });

  // Note: Use 'import-foods --preset japan' for Japanese food imports

  // Note: For batch category sync, use 'import-foods' with appropriate batch size and retry options

  // Rollback command for food import failures
  program
    .command('rollback-import')
    .description('Rollback a failed food import using report file')
    .requiredOption('-r, --report-path [path]', 'Path to import report JSON file')
    .option('--dry-run', 'Preview rollback actions without executing', false)
    .action(async (options) => {
      await rollbackImportCommand({
        reportPath: options.reportPath,
        dryRun: options.dryRun,
      });
    });

  // Check nutrient records command
  program
    .command('check-nutrients')
    .description('Check if specific nutrient table records exist')
    .requiredOption('-t, --table [table]', 'Nutrient table ID (e.g., AUSNUT)')
    .requiredOption('-r, --record-id [recordId]', 'Nutrient record ID (e.g., 02D10267)')
    .option('--dry-run', 'Preview check without creating test food', false)
    .action(async (options) => {
      await checkNutrientsCommand({
        table: options.table,
        recordId: options.recordId,
        dryRun: options.dryRun,
      });
    });

  // Batch nutrient validation command
  program
    .command('validate-nutrients-batch')
    .description('Validate all nutrient mappings in a CSV file before import')
    .requiredOption('-i, --input-path [input path]', 'Food list CSV file path')
    .requiredOption('-l, --locale-id [locale ID]', 'Target locale ID (e.g., jp_JP_2024)')
    .option('--skip-header-rows [rows]', 'Number of header rows to skip', '2')
    .option('--skip-invalid-nutrients', 'Allow validation to pass even with invalid nutrients', false)
    .option('--report-path [path]', 'Path for validation report file')
    .option('--dry-run', 'Preview validation without testing', false)
    .action(async (options) => {
      await validateNutrientsBatchCommand({
        inputPath: options.inputPath,
        localeId: options.localeId,
        skipHeaderRows: Number.parseInt(options.skipHeaderRows),
        skipInvalidNutrients: options.skipInvalidNutrients,
        reportPath: options.reportPath,
        dryRun: options.dryRun,
      });
    });

  // Convert report formats command
  program
    .command('convert-report')
    .description('Convert import report between different formats (JSON ↔ CSV ↔ Markdown)')
    .requiredOption('-i, --input-path [path]', 'Path to input report file')
    .requiredOption('-f, --output-format [format]', 'Output format (csv, json, markdown)')
    .option('-o, --output-path [path]', 'Output file path (auto-generated if not specified)')
    .option('--input-format [format]', 'Input format (auto-detected if not specified)')
    .action(async (options) => {
      await convertReportCommand({
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        outputFormat: options.outputFormat,
        inputFormat: options.inputFormat,
      });
    });

  // Cross-check import results command
  program
    .command('cross-check-import')
    .description('Cross-check import results against original CSV using validation analysis')
    .requiredOption('-c, --csv-path [path]', 'Path to original CSV file')
    .requiredOption('-r, --report-path [path]', 'Path to import report JSON file')
    .requiredOption('-l, --locale-id [locale]', 'Locale ID (e.g., jp_JP_2024)')
    .option('-o, --output-path [path]', 'Path to save cross-check report')
    .option('--check-existing-foods', 'Check if foods exist in database via API', false)
    .option('--generate-validation-report', 'Generate detailed validation analysis using excel-reader', false)
    .option('--dry-run', 'Skip database checks (for faster analysis)', false)
    .action(async (options) => {
      await crossCheckImportCommand({
        csvPath: options.csvPath,
        reportPath: options.reportPath,
        localeId: options.localeId,
        outputPath: options.outputPath,
        checkExistingFoods: options.checkExistingFoods,
        generateValidationReport: options.generateValidationReport,
        dryRun: options.dryRun,
      });
    });

  // Database-CSV consistency verification command
  program
    .command('verify-consistency')
    .description('Verify consistency between CSV food data and database records')
    .requiredOption('-i, --input-path [input path]', 'Food list CSV file path')
    .requiredOption('-l, --locale-id [locale ID]', 'Target locale ID (e.g., jp_JP_2024)')
    .option('-r, --report-path [path]', 'Path to save consistency report')
    .option('-f, --report-format [format]', 'Report format (csv, json, markdown)', 'json')
    .option('--skip-header-rows [rows]', 'Number of header rows to skip', '3')
    .option('--no-check-categories', 'Skip category consistency checks')
    .option('--no-check-names', 'Skip name consistency checks')
    .option('--no-check-attributes', 'Skip attribute consistency checks (ready meal, same as before, etc.)')
    .option('--no-check-nutrients', 'Skip nutrient table consistency checks')
    .option('--no-check-portion-sizes', 'Skip portion size method consistency checks')
    .option('--no-check-associated-foods', 'Skip associated food consistency checks')
    .option('--include-valid-rows', 'Include perfectly matching rows in detailed report', false)
    .action(async (options) => {
      await verifyConsistencyCommand({
        inputPath: options.inputPath,
        localeId: options.localeId,
        reportPath: options.reportPath,
        reportFormat: options.reportFormat,
        skipHeaderRows: Number.parseInt(options.skipHeaderRows),
        checkCategories: options.checkCategories,
        checkNames: options.checkNames,
        checkAttributes: options.checkAttributes,
        checkNutrients: options.checkNutrients,
        checkPortionSizes: options.checkPortionSizes,
        checkAssociatedFoods: options.checkAssociatedFoods,
        includeValidRows: options.includeValidRows,
      });
    });

  program
    .command('audit-food-list')
    .description('Audit a food list CSV for missing or invalid entries')
    .requiredOption('-i, --input-path [input path]', 'Food list CSV file path')
    .option('-r, --report-path [path]', 'Path to save audit report')
    .option('-f, --report-format [format]', 'Report format (csv, json, markdown)', 'json')
    .option('--include-valid', 'List rows without issues in the report', false)
    .option('--skip-header-rows [rows]', 'Number of initial header rows to skip if auto-detection fails', '1')
    .option('--baseline-path [path]', 'Reference CSV used to highlight changes')
    .action(async (options) => {
      await auditFoodListCommand({
        inputPath: options.inputPath,
        reportPath: options.reportPath,
        reportFormat: options.reportFormat,
        includeValid: options.includeValid,
        skipHeaderRows: Number.parseInt(options.skipHeaderRows),
        baselinePath: options.baselinePath,
      });
    });

  program
    .command('export-translations')
    .description('Export translation JSON files to CSV for translation handoff')
    .requiredOption('-t, --target-lang [code]', 'Target language code (e.g., id)')
    .option('-s, --source-path [path]', 'Root directory containing translation modules', 'packages/i18n/src')
    .option('-b, --base-lang [code]', 'Base language code to compare against', 'en')
    .option('-o, --output-path [path]', 'Directory to write exported CSV files', 'reports/i18n')
    .action(async (options) => {
      await exportTranslationsCommand({
        sourcePath: options.sourcePath,
        baseLang: options.baseLang,
        targetLang: options.targetLang,
        outputPath: options.outputPath,
      });
    });

  // Sync foods from CSV to database command
  program
    .command('sync-foods')
    .description('Sync foods from CSV (source of truth) to database, ensuring DB matches CSV exactly')
    .requiredOption('-i, --input-path [input path]', 'Food list CSV file path')
    .requiredOption('-l, --locale-id [locale ID]', 'Target locale ID (e.g., jp_JP_2024)')
    .option('--dry-run', 'Preview changes without applying them', false)
    .option('-r, --report-path [path]', 'Path to save sync report')
    .option('--skip-header-rows [rows]', 'Number of header rows to skip', '3')
    .option('--force-update', 'Force update even for minor changes like quote differences', false)
    .option('--enable-all', 'Enable all foods from CSV in the locale', false)
    .option('--preset [preset]', 'Use preset configuration for specific locales', 'custom')
    .action(async (options) => {
      // Define presets for different locales (same as import-foods)
      const presets = {
        japan: {
          nutrientTableMapping: {
            AUSNUT: 'AUSNUT',
            STFCJ: 'STFCJ',
            'DCD for Japan': 'DCDJapan',
          },
        },
        uk: {
          nutrientTableMapping: {
            NDNS: 'NDNS',
            McCance: 'MCCANCE',
          },
        },
        france: {
          nutrientTableMapping: {
            CIQUAL: 'CIQUAL',
            ANSES: 'ANSES',
          },
        },
        usa: {
          nutrientTableMapping: {
            USDA: 'USDA',
            SR: 'USDA_SR',
          },
        },
        custom: {
          nutrientTableMapping: {},
        },
      };

      const presetConfig = presets[options.preset as keyof typeof presets] || presets.custom;

      await syncFoodsCommand({
        inputPath: options.inputPath,
        localeId: options.localeId,
        dryRun: options.dryRun,
        reportPath: options.reportPath,
        skipHeaderRows: Number.parseInt(options.skipHeaderRows),
        forceUpdate: options.forceUpdate,
        enableAll: options.enableAll,
        nutrientTableMapping: presetConfig.nutrientTableMapping,
      });
    });

  // OpenSearch migration command for Japanese locale
  program
    .command('opensearch-migrate')
    .description('Migrate Japanese food data to OpenSearch for enhanced search capabilities')
    .option('-l, --locale [locale]', 'Locale to migrate (currently only ja-JP supported)', 'ja-JP')
    .option('-b, --batch-size [size]', 'Batch size for bulk indexing', '500')
    .option('-r, --recreate-index', 'Recreate the index (delete if exists)', false)
    .action(async (options) => {
      await opensearchMigrate.handler({
        locale: options.locale,
        batchSize: Number.parseInt(options.batchSize, 10),
        recreateIndex: options.recreateIndex,
      });
    });

  program
    .command('opensearch-test')
    .description('Run a direct OpenSearch query against the Japanese index')
    .requiredOption('-q, --query <text>', 'Search query text')
    .option('-l, --locale [locale]', 'Locale to test', 'jp_JP_2024')
    .option('-s, --size [size]', 'Number of results to return', '10')
    .option('-v, --verbose', 'Show analyzer output and stats', false)
    .action(async (options) => {
      await opensearchTest.handler({
        query: options.query,
        locale: options.locale,
        size: Number.parseInt(options.size, 10),
        verbose: options.verbose,
      });
    });

  syncFoodAttributes.command(program);
  verifyAssociatedFoods.command(program);
  mergeGeneratedSynonyms.command(program);
  migrateAltNames.command(program);

  await program.parseAsync(process.argv);
}

run()
  .catch((err) => {
    console.error(err instanceof Error ? err.stack : err);

    process.exit(process.exitCode ?? 1);
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
