// Keep the same equipment and interactions on phones with a smaller GPU budget.
export function selectRenderQuality({ width = 1280, pixelRatio = 1, coarsePointer = false, memory, cores, saveData = false } = {}) {
  const lightweight = width <= 768 || coarsePointer || saveData || (memory > 0 && memory <= 4) || (cores > 0 && cores <= 4);
  const cap = lightweight ? 1.25 : 1.5;
  return {
    mode: lightweight ? "lightweight" : "full",
    pixelRatio: Math.min(Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1, cap),
    maxFps: lightweight ? 30 : 60,
    shadowSize: lightweight ? 512 : 1024,
    antialias: !lightweight,
    particles: lightweight ? 32 : 64,
  };
}

export function readRenderQuality() {
  return selectRenderQuality({
    width: window.innerWidth,
    pixelRatio: window.devicePixelRatio,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    memory: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency,
    saveData: navigator.connection?.saveData,
  });
}

export function frameIsDue(time, previous, maxFps) {
  return !previous || time - previous >= 1000 / maxFps - 0.75;
}
