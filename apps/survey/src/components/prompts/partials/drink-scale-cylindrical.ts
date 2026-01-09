import { Line, Point, Polygon } from '@flatten-js/core';
import { chunk, sortBy } from 'lodash-es';

/*
 Cylindrical symmetry volume esimation method.

 This method will estimate the liquid volume based on just the shape of the fillable
 area and the maximum fill volume without the need for a look-up table with additional
 intermediate measurements.

 This will only work correctly for shapes that are symmetric relative to rotation
 around the central vertical axis, which is true for all mugs, cups and glasses
 that are currently in the system.

 This method will also work for non-convex shapes (like the concave bottom of a
 wine bottle).
*/

/*
 Extracts the symmetrical cross-section shape from the outline coordinates.

 The current implementation takes the X coordinate of the center of the bounding box
 enclosing the fillable area shape, cuts it along the vertical line at that coordinate,
 and discards the right half.
*/
export function getSymmetryShape(outlineCoordinates: number[]): Polygon {
  const points = chunk(outlineCoordinates, 2) as [number, number][];
  const fillableArea = new Polygon(points);

  // Pick the symmetry line
  const symmetryX = fillableArea.box.center.x;
  const cut = fillableArea.cutWithLine(new Line(new Point(symmetryX, 0), new Point(symmetryX, 1)));

  const facesToDelete: Flatten.Face[] = [];

  // Find faces to the right of the symmetry line
  // There will normaly be just two faces in the result of the cut operation
  for (const face of Array.from(cut.faces)) {
    const centre = (face as Flatten.Face).box.center;
    if (centre.x > symmetryX)
      facesToDelete.push(face);
  }

  // Delete faces in a separate pass to avoid concurrent modification issues
  for (const face of facesToDelete) {
    cut.deleteFace(face);
  }

  return cut;
}

/*
Calculates the surface of the symmetrical fillable volume at a given Y
coordinate.

Finds all intersections between the symmetry shape and the horizontal line
then iterates from the outermost intersection to innermost relative to the
symmetry axis.

Each pair of intersection is treated as entry and exit points into the shape's
volume and thus forms a ring when rotated around the symmetry axis.

The surfaces of all such rings are summed to produce the final result.
*/
function segmentSurface(rotationalProfile: Polygon, position: number): number {
  const symmetryX = rotationalProfile.box.xmax;
  const intersections = rotationalProfile.intersect(new Line(new Point(0, position), new Point(1, position)));
  const pairs = chunk(sortBy(intersections, p => p.x), 2);

  let segmentSurface = 0;

  for (const ring of pairs) {
    if (ring.length !== 2)
      continue;

    const outerRadius = symmetryX - ring[0].x;
    const innerRadius = symmetryX - ring[1].x;

    segmentSurface += Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
  }

  return segmentSurface;
}

/*
Calculates the approximate volume created by clipping the fillable area
symmetry shape at the given fillLevelY coordinate and rotating it around
the symmetry axis.

The volume is approximated by a number of segments along the vertical axis
where each segment is formed from a set of concentric rings of height stepHeight
for concave shapes or a cylinder of height stepHeight for convex shapes, and their
correpsonding radii are calculated by intersecting a line with the symmetry shape.
*/
export function calculateFillVolume(symmetryShape: Polygon, fillLevelY: number, stepHeight: number): number {
  const volumeUpperBound = symmetryShape.box.ymax;
  const volumeHeight = volumeUpperBound - fillLevelY;

  if (volumeHeight <= 0)
    return 0;

  const steps = Math.ceil(volumeHeight / stepHeight);
  const segmentHeight = volumeHeight / steps;

  let volume = 0;

  for (let i = 0; i < steps; ++i) {
    const segmentPos = fillLevelY + i * segmentHeight + segmentHeight * 0.5;
    volume += segmentSurface(symmetryShape, segmentPos) * segmentHeight;
  }

  return volume;
}
