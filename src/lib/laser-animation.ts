import { projectPlate } from "./plate-projection";
import {
  brandContours as contours,
  brandSegments as segments,
  brandLength as totalLength,
  brandPointAt as pathAt,
} from "./brand-paths";
import { workpieceCycle } from "./workpiece-cycle.mjs";
import { drawWorkpieceBed } from "./workpiece-bed";
import { readRenderQuality, frameIsDue } from "./render-quality.mjs";
export type Point = { x: number; y: number };
type Spark = Point & {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  width: number;
};
type Trace = Point & { time: number };

export { projectPlate } from "./plate-projection";

function inversePlate(point: Point, offset: number): Point {
  const x = point.x - 67,
    y = point.y - 633 - offset;
  const determinant = 553 * 277 + 353 * 193;
  return {
    x: Math.max(0.13, Math.min(0.88, (277 * x - 353 * y) / determinant)),
    y: Math.max(0.17, Math.min(0.83, (193 * x + 553 * y) / determinant)),
  };
}

export interface LaserEngine {
  point(clientX: number, clientY: number): void;
  leave(): void;
  nudge(dx: number, dy: number): void;
  pause(paused: boolean): void;
  reset(): void;
  automatic(): void;
  destroy(): void;
}

export function createLaserAnimation(
  canvas: HTMLCanvasElement,
  callbacks: {
    ready: () => void;
    mode: (manual: boolean) => void;
    reduced: (value: boolean) => void;
    unavailable: () => void;
    cycle?: (phase: string, index: number) => void;
  },
): LaserEngine {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    callbacks.unavailable();
    return {
      point() {},
      leave() {},
      nudge() {},
      pause() {},
      automatic() {
      manualUntil = 0;
      setManual(false);
      tiltTargetX = tiltTargetY = 0;
      wake();
    },
    reset() {},
      automatic() {},
      destroy() {},
    };
  }
  const ctx = context;
  let quality = readRenderQuality();
  const root = canvas.parentElement!;
  const bed = new Image(),
    head = new Image();
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let alive = true,
    loaded = false,
    visible = false,
    paused = false,
    reduced = preference.matches;
  let animation = 0,
    lastTime = 0,
    progress = 0,
    width = 1,
    height = 1,
    viewHeight = 800,
    offset = -150;
  let previousPhase = "";
  let reportedCycle = "";
  let elapsed = 0,
    pieceShift = 0,
    pieceIndex = 0;
  let current = projectPlate(pathAt(progress).point, offset),
    manualTarget: Point = { x: 0.5, y: 0.5 };
  let manualUntil = 0,
    isManual = false,
    tiltX = 0,
    tiltY = 0,
    tiltTargetX = 0,
    tiltTargetY = 0;
  const sparks: Spark[] = [],
    traces: Trace[] = [];
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else stop();
    },
    { threshold: 0.04 },
  );
  observer.observe(root);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  callbacks.reduced(reduced);

  function resize() {
    const rect = root.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    quality = readRenderQuality();
    const pixelRatio = quality.pixelRatio;
    canvas.dataset.renderQuality = quality.mode;
    canvas.dataset.maxFps = String(quality.maxFps);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    viewHeight = (height / width) * 1000;
    offset = viewHeight - 950;
    current = projectPlate(pathAt(progress).point, offset);
    draw(performance.now(), 0);
    wake();
  }

  function stop() {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    lastTime = 0;
  }
  function wake() {
    if (!alive || !loaded || !visible || document.hidden || animation) return;
    if (paused || reduced) {
      draw(performance.now(), 0);
      return;
    }
    animation = requestAnimationFrame(frame);
  }
  function frame(time: number) {
    animation = 0;
    if (!alive || !loaded || !visible || paused || reduced || document.hidden) {
      lastTime = 0;
      return;
    }
    if (!frameIsDue(time, lastTime, quality.maxFps)) { wake(); return; }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 1 / 60;
    lastTime = time;
    draw(time, dt);
    animation = requestAnimationFrame(frame);
  }

  function setManual(value: boolean) {
    if (value !== isManual) {
      isManual = value;
      callbacks.mode(value);
    }
  }

  function strokeCompleted(
    distance: number,
    lineWidth: number,
    color: string,
    blur = 0,
  ) {
    ctx.beginPath();
    let remaining = distance;
    for (const segment of segments) {
      if (remaining <= 0) break;
      const t = Math.min(1, remaining / segment.length),
        a = projectPlate(segment.a, offset + pieceShift),
        b = projectPlate(
          {
            x: segment.a.x + (segment.b.x - segment.a.x) * t,
            y: segment.a.y + (segment.b.y - segment.a.y) * t,
          },
          offset + pieceShift,
        );
      if (segment.cutting) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      remaining -= segment.length;
    }
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function draw(time: number, dt: number) {
    if (!loaded || !alive) return;
    ctx.setTransform(canvas.width / 1000, 0, 0, canvas.width / 1000, 0, 0);
    ctx.fillStyle = "#102a26";
    ctx.fillRect(0, 0, 1000, viewHeight);
    // Manual guidance holds the programmed path; it never cuts elsewhere at the same time.
    if (dt && (manualUntil <= time || previousPhase !== "working")) elapsed += dt;
    const cycle = workpieceCycle(elapsed, 13, viewHeight + 450);
    if (
      cycle.index !== pieceIndex ||
      (cycle.phase === "loading" && previousPhase !== "loading")
    ) {
      pieceIndex = cycle.index;
      traces.length = sparks.length = 0;
    }
    previousPhase = cycle.phase;
    const report = `${reduced ? "complete" : cycle.phase}:${cycle.index}`;
    if (report !== reportedCycle) {
      reportedCycle = report;
      callbacks.cycle?.(reduced ? "complete" : cycle.phase, cycle.index);
    }
    pieceShift = reduced ? 0 : cycle.shift;
    drawWorkpieceBed(ctx, bed, offset, pieceShift);
    const manual = manualUntil > time && !reduced && cycle.phase === "working";
    setManual(manual);
    progress = reduced ? totalLength : totalLength * cycle.progress;
    const path = pathAt(progress),
      target = projectPlate(
        cycle.phase === "working"
          ? manual
            ? manualTarget
            : path.point
          : { x: 0.87, y: 0.16 },
        offset - (cycle.phase === "working" ? 0 : 70),
      );
    const easing = dt && manual ? 1 - Math.exp(-dt * 12) : 1;
    if (!paused) {
      current.x += (target.x - current.x) * easing;
      current.y += (target.y - current.y) * easing;
    }
    const cutting =
      !reduced && cycle.phase === "working" && (manual || path.cutting);
    const complete = reduced ? totalLength : progress;
    if (cycle.phase !== "loading")
      strokeCompleted(totalLength, 1.8, "rgba(24,53,45,.32)");
    strokeCompleted(complete, 5.5, "rgba(9,15,13,.9)");
    ctx.save();
    ctx.translate(0, -1.4);
    strokeCompleted(complete, 1.2, "rgba(221,214,190,.78)");
    ctx.restore();
    // The cut cools behind the head instead of glowing across the whole completed logo.
    if (cutting) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      strokeCompleted(complete, 1.2, "rgba(245,178,91,.3)");
      ctx.restore();
    }

    // Manual cuts remain on the sheet for a short time, with a bounded trace buffer.
    if (
      manual &&
      dt &&
      (!traces.length ||
        Math.hypot(current.x - traces.at(-1)!.x, current.y - traces.at(-1)!.y) >
          1.8)
    ) {
      traces.push({ ...current, time: elapsed * 1000 });
      if (traces.length > 400) traces.shift();
    }
    while (traces.length && elapsed * 1000 - traces[0].time > 20000)
      traces.shift();
    if (traces.length > 1) {
      ctx.beginPath();
      ctx.moveTo(traces[0].x, traces[0].y + pieceShift);
      for (let i = 1; i < traces.length; i++)
        if (traces[i].time - traces[i - 1].time < 160)
          ctx.lineTo(traces[i].x, traces[i].y + pieceShift);
        else ctx.moveTo(traces[i].x, traces[i].y + pieceShift);
      ctx.strokeStyle = "rgba(21,25,21,.85)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(227,176,98,.75)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // Contact shadow pins the moving head to the same work plane as the cut.
    ctx.save();
    ctx.translate(current.x - 18, current.y + 18);
    ctx.scale(1, 0.28);
    const shadow = ctx.createRadialGradient(0, 0, 3, 0, 0, 110);
    shadow.addColorStop(0, "rgba(0,8,5,.46)");
    shadow.addColorStop(1, "rgba(0,8,5,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (cutting) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.translate(current.x, current.y + 28);
      ctx.scale(1, 0.26);
      const reflection = ctx.createRadialGradient(0, 0, 1, 0, 0, 126);
      reflection.addColorStop(0, "rgba(255,179,71,.42)");
      reflection.addColorStop(1, "rgba(255,140,29,0)");
      ctx.fillStyle = reflection;
      ctx.beginPath();
      ctx.arc(0, 0, 126, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const headHeight = Math.min(470, Math.max(320, viewHeight - 350)),
      headWidth = headHeight * (head.width / head.height);
    ctx.drawImage(
      head,
      current.x - headWidth * 0.498,
      current.y - headHeight * 0.991 - 7,
      headWidth,
      headHeight,
    );
    if (cutting) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const glow = ctx.createRadialGradient(
        current.x,
        current.y,
        1,
        current.x,
        current.y,
        48,
      );
      glow.addColorStop(0, "rgba(255,248,204,1)");
      glow.addColorStop(0.13, "rgba(255,203,108,.95)");
      glow.addColorStop(0.46, "rgba(255,145,28,.23)");
      glow.addColorStop(1, "rgba(255,136,20,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(current.x - 48, current.y - 48, 96, 96);
      ctx.strokeStyle = "#fff9d6";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffb84f";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(current.x, current.y - 15);
      ctx.lineTo(current.x, current.y + 3);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (dt)
        for (let i = 0; i < 3 && sparks.length < 110; i++) {
          const direction = Math.random() < 0.22 ? -1 : 1,
            angle = -0.55 + Math.random() * 1.1,
            speed = 100 + Math.random() * 410,
            life = 0.13 + Math.random() * 0.36;
          sparks.push({
            x: current.x,
            y: current.y,
            vx: Math.cos(angle) * speed * direction,
            vy: Math.sin(angle) * speed * 0.55 - 20,
            life,
            maxLife: life,
            width: 0.8 + Math.random() * 1.6,
          });
        }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        if (dt) {
          spark.life -= dt;
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;
          spark.vy += 160 * dt;
        }
        if (spark.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const alpha = spark.life / spark.maxLife;
        ctx.strokeStyle = `rgba(255,${Math.round(148 + alpha * 88)},${Math.round(36 + alpha * 128)},${alpha})`;
        ctx.lineWidth = spark.width;
        ctx.beginPath();
        ctx.moveTo(spark.x, spark.y);
        ctx.lineTo(spark.x - spark.vx * 0.028, spark.y - spark.vy * 0.028);
        ctx.stroke();
      }
      ctx.fillStyle = "#fffbe8";
      ctx.beginPath();
      ctx.arc(current.x, current.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (manual) {
      ctx.strokeStyle = "rgba(229,251,237,.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(target.x - 22, target.y);
      ctx.lineTo(target.x + 22, target.y);
      ctx.moveTo(target.x, target.y - 22);
      ctx.lineTo(target.x, target.y + 22);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (dt) {
      tiltX += (tiltTargetX - tiltX) * 0.06;
      tiltY += (tiltTargetY - tiltY) * 0.06;
    }
    root.style.setProperty("--scene-rx", `${tiltX.toFixed(3)}deg`);
    root.style.setProperty("--scene-ry", `${tiltY.toFixed(3)}deg`);
    // Expose the actual rendered position for accessibility-focused browser QA.
    canvas.dataset.pattern = "fasttrack-mark";
    canvas.dataset.progress = (complete / totalLength).toFixed(3);
    canvas.dataset.workpiecePhase = reduced ? "complete" : cycle.phase;
    canvas.dataset.workpieceIndex = String(cycle.index);
    canvas.dataset.workpieceShift = pieceShift.toFixed(2);
    canvas.dataset.clock = elapsed.toFixed(3);
    canvas.dataset.laserX = current.x.toFixed(1);
    canvas.dataset.laserY = current.y.toFixed(1);
    canvas.dataset.mode = paused
      ? "paused"
      : reduced
        ? "reduced"
        : manual
          ? "manual"
          : "auto";
  }

  function pointer(clientX: number, clientY: number) {
    if (paused || reduced) return;
    const rect = root.getBoundingClientRect(),
      x = (clientX - rect.left) / rect.width,
      y = (clientY - rect.top) / rect.height;
    manualTarget = inversePlate({ x: x * 1000, y: y * viewHeight }, offset);
    manualUntil = performance.now() + 2200;
    tiltTargetX = (0.5 - y) * 3;
    tiltTargetY = (x - 0.5) * 4;
    wake();
  }
  function onVisibility() {
    if (document.hidden) stop();
    else wake();
  }
  function onPreference() {
    reduced = preference.matches;
    callbacks.reduced(reduced);
    stop();
    sparks.length = 0;
    draw(performance.now(), 0);
    wake();
  }
  document.addEventListener("visibilitychange", onVisibility);
  preference.addEventListener("change", onPreference);
  let completed = 0;
  const onLoad = () => {
    if (++completed === 2 && alive) {
      loaded = true;
      resize();
      callbacks.ready();
      wake();
    }
  };
  bed.onload = onLoad;
  head.onload = onLoad;
  bed.onerror = head.onerror = () => {
    if (alive) callbacks.unavailable();
  };
  bed.src = "/images/laser-bed.webp";
  head.src = "/images/laser-head.webp";
  return {
    point: pointer,
    leave() {
      manualUntil = 0;
      tiltTargetX = tiltTargetY = 0;
      wake();
    },
    nudge(dx, dy) {
      if (paused || reduced) return;
      if (!isManual) manualTarget = pathAt(progress).point;
      manualTarget = {
        x: Math.max(0.13, Math.min(0.88, manualTarget.x + dx)),
        y: Math.max(0.17, Math.min(0.83, manualTarget.y + dy)),
      };
      manualUntil = performance.now() + 4500;
      wake();
    },
    pause(value) {
      paused = value;
      stop();
      sparks.length = 0;
      draw(performance.now(), 0);
      wake();
    },
    automatic() {
      manualUntil = 0;
      setManual(false);
      tiltTargetX = tiltTargetY = 0;
      wake();
    },
    reset() {
      progress = 0;
      elapsed = pieceShift = pieceIndex = 0;
      previousPhase = reportedCycle = "";
      manualUntil = 0;
      traces.length = 0;
      sparks.length = 0;
      current = projectPlate(pathAt(0).point, offset);
      draw(performance.now(), 0);
      wake();
    },
    destroy() {
      alive = false;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      bed.onload = head.onload = bed.onerror = head.onerror = null;
    },
  };
}
