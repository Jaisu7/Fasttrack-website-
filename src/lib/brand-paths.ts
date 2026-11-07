import originalMark from "./brand-mark.json";

export type BrandPoint = { x: number; y: number };
export type BrandSegment = {
  a: BrandPoint;
  b: BrandPoint;
  length: number;
  cutting: boolean;
};
// Contours are traced from the original company artwork, including its negative spaces.
export const brandContours: BrandPoint[][] = originalMark.map((contour) =>
  contour.map(([x, y]) => ({ x: 0.13 + x * 0.74, y: 0.17 + y * 0.66 })),
);
export const brandSegments: BrandSegment[] = [];
const distance = (a: BrandPoint, b: BrandPoint) =>
  Math.hypot(
    (b.x - a.x) * 553 + (b.y - a.y) * 353,
    -(b.x - a.x) * 193 + (b.y - a.y) * 277,
  );
brandContours.forEach((contour, index) => {
  if (index) {
    const a = brandContours[index - 1].at(-1)!,
      b = contour[0];
    brandSegments.push({ a, b, length: distance(a, b), cutting: false });
  }
  for (let i = 1; i < contour.length; i++) {
    const a = contour[i - 1],
      b = contour[i];
    brandSegments.push({ a, b, length: distance(a, b), cutting: true });
  }
});
export const brandLength = brandSegments.reduce(
  (sum, segment) => sum + segment.length,
  0,
);
export function brandPointAt(distance: number) {
  let remaining = Math.max(0, Math.min(brandLength, distance));
  for (const segment of brandSegments) {
    if (remaining <= segment.length && segment.length) {
      const t = remaining / segment.length;
      return {
        point: {
          x: segment.a.x + (segment.b.x - segment.a.x) * t,
          y: segment.a.y + (segment.b.y - segment.a.y) * t,
        },
        cutting: segment.cutting,
      };
    }
    remaining -= segment.length;
  }
  return { point: brandContours.at(-1)!.at(-1)!, cutting: false };
}
export function nearestBrandPoint(point: BrandPoint) {
  let best = Infinity,
    travelled = 0,
    bestDistance = 0;
  for (const segment of brandSegments) {
    if (!segment.cutting) {
      travelled += segment.length;
      continue;
    }
    const ax = segment.a.x * 553 + segment.a.y * 353,
      ay = -segment.a.x * 193 + segment.a.y * 277;
    const bx = segment.b.x * 553 + segment.b.y * 353,
      by = -segment.b.x * 193 + segment.b.y * 277;
    const px = point.x * 553 + point.y * 353,
      py = -point.x * 193 + point.y * 277;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) /
          Math.max(1, segment.length ** 2),
      ),
    );
    const separation = Math.hypot(
      px - ax - (bx - ax) * t,
      py - ay - (by - ay) * t,
    );
    if (separation < best) {
      best = separation;
      bestDistance = travelled + segment.length * t;
    }
    travelled += segment.length;
  }
  return { ...brandPointAt(bestDistance), distance: bestDistance };
}
export const brandPunchPoints: BrandPoint[] = [];
for (const contour of brandContours) {
  const lengths = contour
    .slice(1)
    .map((point, index) => distance(contour[index], point));
  const total = lengths.reduce((sum, n) => sum + n, 0);
  const count = Math.max(4, Math.round(total / 28));
  for (let i = 0; i < count; i++) {
    let remaining = (total * i) / count;
    for (let j = 0; j < lengths.length; j++) {
      if (remaining <= lengths[j]) {
        const t = remaining / lengths[j],
          a = contour[j],
          b = contour[j + 1];
        brandPunchPoints.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        });
        break;
      }
      remaining -= lengths[j];
    }
  }
}
