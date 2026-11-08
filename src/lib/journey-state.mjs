export const manufacturingStages = [
  "raw-steel",
  "laser-cutting",
  "press-brake",
  "welding",
  "showroom",
];
export const clampProgress = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const thresholds = [0, 0.14, 0.34, 0.5776, 0.7888, 1];
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
    4,
    thresholds.findIndex((threshold, i) => i > 0 && progress < threshold) - 1,
  );
  const index = stageIndex < 0 ? 4 : stageIndex;
  const phase = clampProgress(
    (progress - thresholds[index]) /
      (thresholds[index + 1] - thresholds[index]),
  );
  const sceneProgress = progress < 0.34 ? progress : 0.5 + ((progress - 0.34) / 0.66) * 0.5;
  return {
    sceneProgress,
    progress,
    stageIndex: index,
    stage: manufacturingStages[index],
    phase,
    raw: clampProgress(sceneProgress / 0.14),
    laser: clampProgress((sceneProgress - 0.14) / 0.2),
    bend: clampProgress((sceneProgress - 0.5) / 0.18),
    weld: clampProgress((sceneProgress - 0.705) / 0.125),
    finish: clampProgress((sceneProgress - 0.84) / 0.16),
    foldLeft: smoothRange(sceneProgress, 0.511, 0.565),
    foldRight: smoothRange(sceneProgress, 0.591, 0.647),
    upright: smoothRange(sceneProgress, 0.652, 0.683),
    assembly: smoothRange(sceneProgress, 0.658, 0.725),
    doors: smoothRange(sceneProgress, 0.788, 0.895),
    doorOpen: smoothRange(sceneProgress, 0.91, 0.97),
  };
}
