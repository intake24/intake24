import type { GenerateAsServedPackageOptions } from '@intake24/food-tools';
import { generateAsServedPackageCommand } from '@intake24/food-tools';

export type { GenerateAsServedPackageOptions };

export default async function generateAsServedPackage(
  options: GenerateAsServedPackageOptions,
): Promise<void> {
  await generateAsServedPackageCommand(options);
}
