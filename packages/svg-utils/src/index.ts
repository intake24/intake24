import type { ElementNode, Node, RootNode } from 'svg-parser';

import { readFile } from 'node:fs/promises';

import { parse } from 'svg-parser';
import * as svgpath from 'svgpath';

const supportedSegmentTypes = ['M', 'L', 'H', 'V', 'm', 'l', 'h', 'v', 'z', 'Z'];

type PathWithTransform = {
  id: string;
  pathData: string;
  transformStack: string[];
};

export type ImageMapData = {
  navigation: string[];
  objects: ImageMapObject[];
};

export type ImageMapObject = {
  objectId: string;
  coords: number[];
};

function getTransform(node: ElementNode): string | undefined {
  return node.properties?.transform?.toString();
}

function convertToNormalisedCoordinates(
  viewBox: number[],
  pathWithTx: PathWithTransform,
  useWidthForBothAxes: boolean = false,
): number[] {
  const [minX, minY, width, height] = viewBox;

  const coords: number[] = [];

  let path = svgpath.from(pathWithTx.pathData);

  for (const tx of pathWithTx.transformStack)
    path = path.transform(tx);

  path.iterate((segment, index, x, y) => {
    if (!supportedSegmentTypes.includes(segment[0]))
      throw new Error(`SVG path segment type ${segment[0]} is not supported`);

    // Coordinate at index 0 is initial 0, 0
    if (index > 0)
      coords.push((x - minX) / width, (y - minY) / (useWidthForBothAxes ? width : height));
  });

  return coords;
}

function findOutlinePath(current: Node, transformStack: string[]): PathWithTransform | undefined {
  if (current.type === 'element' && current.properties !== undefined) {
    const id = current.properties.id;
    const tx = getTransform(current);
    const elementTxStack = tx !== undefined ? transformStack.concat(tx) : transformStack;

    if (current.tagName === 'path' && id === 'outline') {
      const pathData = current.properties.d;

      if (typeof pathData !== 'string') {
        throw new TypeError(
          'Found a path node with the id "outline" but it has no path data attribute',
        );
      }

      return {
        id,
        pathData,
        transformStack: elementTxStack,
      };
    }

    for (const child of current.children) {
      if (typeof child === 'string')
        continue;

      const outlinePath = findOutlinePath(child, elementTxStack);

      if (outlinePath !== undefined)
        return outlinePath;
    }
  }

  return undefined;
}

function findAreaPaths(current: Node, transformStack: string[], paths: PathWithTransform[]): void {
  if (current.type === 'element' && current.properties !== undefined) {
    const id = current.properties.id;
    const tx = getTransform(current);
    const elementTxStack = tx !== undefined ? transformStack.concat(tx) : transformStack;

    if (current.tagName === 'path' && typeof id === 'string' && id.startsWith('area_')) {
      const pathData = current.properties.d;

      if (typeof pathData !== 'string')
        throw new Error('Found a path node with the id "area_*" but it has no path data attribute');

      paths.push({
        id,
        pathData,
        transformStack: elementTxStack,
      });
    }

    for (const child of current.children) {
      if (typeof child === 'string')
        continue;

      findAreaPaths(child, elementTxStack, paths);
    }
  }
}

function collectTextParts(current: Node, parts: string[]): void {
  if (current.type === 'element') {
    for (const child of current.children) {
      if (typeof child === 'string')
        parts.push(child);
      else collectTextParts(child, parts);
    }
  }
  else if (current.value !== undefined) {
    parts.push(current.value.toString());
  }
}

function getText(current: Node): string | undefined {
  const parts: string[] = [];
  collectTextParts(current, parts);
  if (parts.length === 0)
    return undefined;
  return parts.join();
}

function findNavigation(current: Node): string | undefined {
  if (current.type === 'element' && current.properties !== undefined) {
    const id = current.properties.id;

    if (current.tagName === 'text' && id === 'navigation')
      return getText(current);

    for (const child of current.children) {
      if (typeof child === 'string')
        continue;

      const navText = findNavigation(child);

      if (navText !== undefined)
        return navText;
    }
  }

  return undefined;
}

function getViewBox(root: RootNode): number[] {
  for (const node of root.children) {
    if (node.type === 'element' && node.tagName === 'svg') {
      const viewBox = node.properties?.viewBox;

      if (viewBox !== undefined && typeof viewBox === 'string')
        return viewBox.split(' ').map(s => Number.parseFloat(s));
    }
  }

  throw new Error('Failed to find the <svg> element or it has no viewBox attribute');
}

export async function getDrinkScaleOutline(svgPath: string): Promise<number[]> {
  const svg = await readFile(svgPath, 'utf-8');
  const root = parse(svg);

  const outline = findOutlinePath(root.children[0], []);

  if (outline !== undefined)
    return convertToNormalisedCoordinates(getViewBox(root), outline);
  else
    throw new Error('Failed to find the outline node in the SVG file');
}

export async function getImageMapData(svgPath: string): Promise<ImageMapData> {
  const svg = await readFile(svgPath, 'utf-8');
  const root = parse(svg);

  const objectPaths: PathWithTransform[] = [];

  findAreaPaths(root.children[0], [], objectPaths);

  if (objectPaths.length === 0) {
    throw new Error(
      'Could not find any path objects with ids starting with "area_" in the SVG file',
    );
  }

  const navigation = findNavigation(root.children[0]);

  if (navigation === undefined)
    throw new Error('Could not find a text element with the id "navigation"');

  const viewBox = getViewBox(root);

  const objects: ImageMapObject[] = objectPaths.map(objectPath => ({
    objectId: objectPath.id.substring(5), // drop "area_"
    coords: convertToNormalisedCoordinates(viewBox, objectPath, true),
  }));

  return {
    navigation: navigation.trim().split(/\s+/),
    objects,
  };
}
