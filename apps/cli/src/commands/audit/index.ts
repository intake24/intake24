import { Argument, Command } from 'commander';

import disable from './disable';
import enable from './enable';
import setup from './setup';

export default async function (program: Command): Promise<void> {
  const dbArg = new Argument('<db>', 'Database type').choices(['foods', 'system']);

  program
    .command('audit:setup')
    .description('Set up the audit table and trigger function')
    .addArgument(dbArg)
    .option('--force', 'Force setup (drop existing table and function)', false)
    .action(async (db, options) => {
      await setup(db, options);
    });

  program
    .command('audit:enable')
    .description('Enable audit triggers on all tables')
    .addArgument(dbArg)
    .option('--force', 'Force enable (drop existing triggers)', false)
    .action(async (db, options) => {
      await enable(db, options);
    });

  program
    .command('audit:disable')
    .description('Disable audit triggers on all tables')
    .addArgument(dbArg)
    .option('-f, --force', 'Force disable (drop existing triggers)', false)
    .action(async (db, options) => {
      await disable(db, options);
    });
};
