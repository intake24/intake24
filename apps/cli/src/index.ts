/* eslint-disable perfectionist/sort-imports */
import './bootstrap';
import { Argument, Command, Option } from 'commander';
import buildFrAlbaneLocaleCommand from '@intake24/cli/commands/fr-albane/build-fr-albane-command';
import buildFrInca3LocaleCommand from '@intake24/cli/commands/fr-inca3/build-fr-locale-command';
import buildGoustoLocaleCommand from './commands/gousto/build-gousto-locale-command';
import buildUaeLocaleCommand from './commands/uae/build-uae-locale-command';
import convertDrinkScale from '@intake24/cli/commands/svg-converters/convert-drink-scale';
import convertImageMap from '@intake24/cli/commands/svg-converters/convert-image-map';
import pkg from '../package.json';
import {
  extractCategories,
  findPortionImages,
  generateKey,
  generateVapidKeys,
  hashPassword,
  initAssets,
  initDbSystem,
  initEnv,
  initFoodImages,
  packageExportV3,
  packageExportV4,
  packageImportV4,
  searchTest,
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
    .command('init:db:system')
    .description('Initialize system databases')
    .action(async () => {
      await initDbSystem();
    });

  program
    .command('init:env')
    .description('Initialize .env files for each application with fresh secrets and keys.')
    .action(async () => {
      await initEnv();
    });

  program
    .command('init:assets')
    .description('Download initial assets (system, foods, images) into specified path.')
    .action(async () => {
      await initAssets();
    });

  program
    .command('init:food-images')
    .description('Download and prepare food images')
    .argument('<url>', 'File URL to download')
    .action(async (url) => {
      await initFoodImages({ url });
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
    .option('--as-served-ids [as-served-ids...]', 'Only include as served sets with specified ids')
    .option('--food-ids [food-ids...]', 'Only include foods with specified ids')
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
