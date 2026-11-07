export const manufacturingStages = [
  "raw-steel",
  "laser-cutting",
  "cnc-punching",
  "press-brake",
  "welding",
  "showroom",
];
export const clampProgress = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const thresholds = [0, 0.14, 0.34, 0.5, 0.68, 0.84, 1];
export const smoothRange = (value, start, end) => {
  const t = clampProgress((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

// Cabinet coordinates after the primary panel has been stood upright.
// Shelves are revealed within the open shell, never passed through a side wall.
export const cabinetInterior = {
  halfWidth: 1,
  bottom: -0.65,
  top: 0.65,
  back: 0.022,
  front: 0.7,
  shelfSize: [1.88, 0.027, 0.59],
};
export function interiorShelfState(value) {
  const p = clampProgress(value);
  const installed = smoothRange(p, 0.699, 0.732);
  return {
    visible: p >= 0.699,
    position: [0, -0.38 + installed * 0.32, 0.35],
    installed,
  };
}

/** Scroll-driven demonstration, tracking one primary panel plus separately assembled parts. */
export function manufacturingState(value) {
  const progress = clampProgress(value);
  const stageIndex = Math.min(
    5,
    thresholds.findIndex((threshold, i) => i > 0 && progress < threshold) - 1,
  );
  const index = stageIndex < 0 ? 5 : stageIndex;
  const phase = clampProgress(
    (progress - thresholds[index]) /
      (thresholds[index + 1] - thresholds[index]),
  );
  return {
    progress,
    stageIndex: index,
    stage: manufacturingStages[index],
    phase,
    raw: clampProgress(progress / 0.14),
    laser: clampProgress((progress - 0.14) / 0.2),
    punch: clampProgress((progress - 0.34) / 0.16),
    bend: clampProgress((progress - 0.5) / 0.18),
    weld: clampProgress((progress - 0.705) / 0.125),
    finish: clampProgress((progress - 0.84) / 0.16),
    foldLeft: smoothRange(progress, 0.511, 0.565),
    foldRight: smoothRange(progress, 0.591, 0.647),
    upright: smoothRange(progress, 0.652, 0.683),
    assembly: smoothRange(progress, 0.658, 0.725),
    doors: smoothRange(progress, 0.788, 0.895),
  };
}
