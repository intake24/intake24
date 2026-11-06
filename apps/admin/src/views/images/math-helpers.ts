function distanceToSegment(p: [number, number], s0: [number, number], s1: [number, number]): number {
  const v0 = [p[0] - s0[0], p[1] - s0[1]];
  const v1 = [s1[0] - s0[0], s1[1] - s0[1]];

  const dot = v0[0] * v1[0] + v0[1] * v1[1];
  const mag = v1[0] * v1[0] + v1[1] * v1[1];
  const proj = mag === 0
    ? -1
    : dot / mag;

  let x, y;

  if (proj < 0) {
    x = s0[0];
    y = s0[1];
  }
  else if (proj > 1) {
    x = s1[0];
    y = s1[1];
  }
  else {
    x = s0[0] + proj * v1[0];
    y = s0[1] + proj * v1[1];
  }

  const dx = p[0] - x;
  const dy = p[1] - y;

  return Math.sqrt(dx * dx + dy * dy);
}

function distance(p0: [number, number], p1: [number, number]): number {
  const x = p1[0] - p0[0];
  const y = p1[1] - p0[1];

  return Math.sqrt(x * x + y * y);
}

function closestVertexIndex(vertices: [number, number][], p: [number, number]): number {
  let closestIndex = -1;
  let closestDist = Number.MAX_VALUE;

  for (let i = 0; i < vertices.length; ++i) {
    const dist = distance(vertices[i], p);

    if (dist < closestDist) {
      closestIndex = i;
      closestDist = dist;
    }
  }

  return closestIndex;
}

function closestSegmentIndex(vertices: [number, number][], p: [number, number]): number {
  if (vertices.length < 2)
    return 0;

  let closestIndex = 0;
  let closestDist = distanceToSegment(p, vertices[0], vertices[1]);

  for (let i = 1; i < vertices.length; ++i) {
    const s0 = vertices[i];
    const i2 = i === vertices.length - 1
      ? 0
      : i + 1;
    const s1 = vertices[i2];

    const d = distanceToSegment(p, s0, s1);

    if (d < closestDist) {
      closestIndex = i;
      closestDist = d;
    }
  }

  return closestIndex;
}

export { closestSegmentIndex, closestVertexIndex, distance, distanceToSegment };
