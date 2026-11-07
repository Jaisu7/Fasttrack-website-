export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export const ease = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
/** Pure, independent production clock. Exit completes before a new blank enters. */
export function workpieceCycle(seconds, workSeconds, travel = 1100) {
  const hold = 1.35,
    eject = 1.25,
    load = 1.2;
  const total = workSeconds + hold + eject + load;
  const safe = Math.max(0, seconds);
  const index = Math.floor(safe / total);
  const t = safe - index * total;
  if (t < workSeconds)
    return {
      index,
      phase: "working",
      workTime: t,
      progress: t / workSeconds,
      shift: 0,
    };
  if (t < workSeconds + hold)
    return {
      index,
      phase: "complete",
      workTime: workSeconds,
      progress: 1,
      shift: 0,
    };
  if (t < workSeconds + hold + eject)
    return {
      index,
      phase: "ejecting",
      workTime: workSeconds,
      progress: 1,
      shift: travel * ease((t - workSeconds - hold) / eject),
    };
  return {
    index,
    phase: "loading",
    workTime: 0,
    progress: 0,
    shift: -travel * (1 - ease((t - workSeconds - hold - eject) / load)),
  };
}
