export type Point = { x: number; y: number };
// This projection follows the photographed plate. It is illustrative, not a CAM toolpath.
export function projectPlate(point: Point, offset = 0): Point {
  return {
    x: 67 + point.x * 553 + point.y * 353,
    y: 633 - point.x * 193 + point.y * 277 + offset,
  };
}
