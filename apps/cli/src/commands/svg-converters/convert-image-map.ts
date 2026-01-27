import type {
  PkgImageMap,
  PkgImageMapObject,
} from '@intake24/cli/commands/packager/types/image-map';
import type { ImageMapData } from '@intake24/svg-utils';

import fs, { copyFile } from 'node:fs/promises';
import path from 'node:path';

import { PkgConstants } from '@intake24/cli/commands/packager/constants';
import { PackageWriter } from '@intake24/cli/commands/packager/package-writer';
import { logger as mainLogger } from '@intake24/common-backend/services/logger';
import { getImageMapData } from '@intake24/svg-utils';

export interface ConvertImageMapOptions {
  id: string;
  description: string;
  svgPath: string;
  baseImagePath: string;
  outputDir: string;
  overwrite: boolean;
  language: string;
}

async function copyDependencies(
  baseImagePath: string,
  imageMapId: string,
  outputDir: string,
  overwrite: boolean,
) {
  const destPath = path.join(
    outputDir,
    PkgConstants.IMAGE_DIRECTORY_NAME,
    'image-maps',
    imageMapId,
    path.basename(baseImagePath),
  );

  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await copyFile(baseImagePath, destPath, overwrite ? 0 : fs.constants.COPYFILE_EXCL);
}
function convertImageMap(
  imageMapId: string,
  description: string,
  svgData: ImageMapData,
  baseImagePath: string,
): PkgImageMap {
  const pkgBaseImagePath = path.join('image-maps', imageMapId, path.basename(baseImagePath));

  const imageMapObjects: [string, PkgImageMapObject][] = svgData.objects.map(svgObj => [
    svgObj.objectId,
    {
      description: 'No description',
      outlineCoordinates: svgObj.coords,
      navigationIndex: svgData.navigation.indexOf(svgObj.objectId),
    },
  ]);

  return {
    baseImagePath: pkgBaseImagePath,
    description,
    objects: Object.fromEntries(imageMapObjects),
  };
}

export default async (options: ConvertImageMapOptions): Promise<void> => {
  const logger = mainLogger.child({ service: 'Convert image map' });

  const packageWriter = new PackageWriter(logger, options.outputDir);

  logger.debug(`Extracting image map from ${options.svgPath}`);

  const svgImageMapData = await getImageMapData(options.svgPath);

  const selectionImageMap = convertImageMap(
    options.id,
    options.description,
    svgImageMapData,
    options.baseImagePath,
  );

  await copyDependencies(
    options.baseImagePath,
    options.id,
    options.outputDir,
    options.overwrite,
  );

  await packageWriter.appendImageMaps({
    [options.id]: selectionImageMap,
  });

  await packageWriter.writePackageInfo();
};
