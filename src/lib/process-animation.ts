import { projectPlate, type LaserEngine, type Point } from "./laser-animation";
import {
  brandContours,
  brandLength,
  brandPointAt,
  brandPunchPoints,
  brandSegments,
  nearestBrandPoint,
} from "./brand-paths";
import { workpieceCycle, punchStroke } from "./workpiece-cycle.mjs";
import { drawWorkpieceBed } from "./workpiece-bed";

export type FabricationProcess = "punching" | "bending" | "welding";
type Callbacks = {
  ready(): void;
  mode(manual: boolean): void;
  reduced(value: boolean): void;
  unavailable(): void;
  cycle?: (phase: string, index: number) => void;
};
type Particle = Point & { vx: number; vy: number; life: number; total: number };
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const punchPattern = brandPunchPoints;
const toolAssets: Record<FabricationProcess, string> = {
  punching: "/images/punch-head.webp",
  bending: "/images/bending-tool.webp",
  welding: "/images/welding-torch.webp",
};

/** Illustrative fabrication, with real geometry and independent, pausable time. */
export function createProcessAnimation(
  canvas: HTMLCanvasElement,
  process: FabricationProcess,
  callbacks: Callbacks,
): LaserEngine {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    callbacks.unavailable();
    return {
      point() {},
      leave() {},
      nudge() {},
      pause() {},
      reset() {},
      automatic() {},
      destroy() {},
    };
  }
  const ctx = context;
  const root = canvas.parentElement!;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const bed = new Image(),
    tool = new Image();
  const holes: Point[] = [];
  const particles: Particle[] = [];
  const manualBeads = new Map<number, Point>();
  let reportedCycle = "";
  let punchFrom: Point = { ...punchPattern[0] };
  let punchTo: Point = { ...punchPattern[0] };
  let punchCycle = -1;
  let alive = true,
    loaded = false,
    visible = false,
    paused = false;
  let reduced = preference.matches,
    animation = 0,
    lastTime = 0;
  let viewHeight = 800,
    offset = -150,
    elapsed = 0;
  const punchInterval = 0.32;
  const duration =
    process === "punching"
      ? punchPattern.length * punchInterval
      : process === "bending"
        ? 4.5
        : 13;
  let workClock = 0,
    pieceShift = 0,
    pieceIndex = 0,
    piecePhase = "working";
  let manualUntil = 0,
    isManual = false,
    lastPunch = -1,
    emission = 0;
  let target: Point = { x: 0.5, y: 0.5 },
    position: Point = { ...punchPattern[0] };
  let fold = 0,
    tiltX = 0,
    tiltY = 0,
    targetTiltX = 0,
    targetTiltY = 0;

  const visibility = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else stop();
    },
    { threshold: 0.04 },
  );
  const dimensions = new ResizeObserver(resize);
  visibility.observe(root);
  dimensions.observe(root);
  callbacks.reduced(reduced);

  function stop() {
    if (animation) cancelAnimationFrame(animation);
    animation = lastTime = 0;
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
    if (!alive || !loaded || !visible || document.hidden || paused || reduced) {
      lastTime = 0;
      return;
    }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 1 / 60;
    lastTime = time;
    if (process !== "welding" || manualUntil <= time || piecePhase !== "working") elapsed += dt;
    draw(time, dt);
    animation = requestAnimationFrame(frame);
  }
  function resize() {
    const rect = root.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    viewHeight = (Math.max(1, rect.height) / Math.max(1, rect.width)) * 1000;
    offset = viewHeight - 950;
    draw(performance.now(), 0);
    wake();
  }
  function polygon(
    points: Point[],
    fill: string | CanvasGradient,
    stroke?: string,
  ) {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  function line(a: Point, b: Point, color: string, width: number) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function glow(p: Point, radius: number, color: string) {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
  }
  function plateCircle(p: Point, radius: number) {
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const q = projectPlate(
        {
          x: p.x + Math.cos(angle) * radius,
          y: p.y + Math.sin(angle) * radius,
        },
        offset + pieceShift,
      );
      if (i) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    }
    ctx.closePath();
  }
  function shadow(p: Point, radius: number, opacity: number) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.3);
    glow({ x: 0, y: 0 }, radius, `rgba(0,8,5,${opacity})`);
    ctx.restore();
  }
  function updatePosition(next: Point, dt: number) {
    if (paused) return;
    const ease = dt ? 1 - Math.exp(-dt * 10) : 1;
    position.x += (next.x - position.x) * ease;
    position.y += (next.y - position.y) * ease;
  }
  function drawPunch(dt: number, manual: boolean) {
    const stroke = punchStroke(workClock, punchInterval, punchPattern.length);
    const cycle = Math.floor(workClock / punchInterval);
    if (piecePhase === "working" && cycle !== punchCycle) {
      punchCycle = cycle;
      punchFrom = { ...position };
      punchTo = { ...(manual ? target : punchPattern[stroke.index]) };
    }
    // Lateral positioning ends before the ram descends: each hole and the tool share one contact point.
    if (!paused) {
      if (piecePhase === "working") {
        position = {
          x: punchFrom.x + (punchTo.x - punchFrom.x) * stroke.travel,
          y: punchFrom.y + (punchTo.y - punchFrom.y) * stroke.travel,
        };
      } else updatePosition({ x: 0.9, y: 0.12 }, dt);
    }
    if (!reduced && dt && piecePhase === "working" && stroke.impact && lastPunch !== cycle) {
      lastPunch = cycle;
      if (!holes.some((p) => Math.hypot(p.x - position.x, p.y - position.y) < 0.018)) {
        holes.push({ ...position });
        if (holes.length > punchPattern.length + 12) holes.shift();
      }
    }
    strokeBrand(brandLength, 1.3, "rgba(26,62,46,.22)");
    const visibleHoles = reduced ? punchPattern : holes;
    for (const hole of visibleHoles) {
      plateCircle(hole, 0.017);
      ctx.fillStyle = "#091714";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(236,242,232,.66)";
      ctx.stroke();
      plateCircle(hole, 0.013);
      ctx.fillStyle = "#10211d";
      ctx.fill();
    }
    const p = projectPlate(position, offset);
    const down = reduced || piecePhase !== "working" ? 0 : stroke.down;
    const lift = 72 * (1 - down);
    if (piecePhase === "working") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.46);
      ctx.strokeStyle = `rgba(231,244,238,${0.18 + down * 0.48})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 23, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    shadow({ x: p.x - 15, y: p.y + 12 }, 96 + lift * 0.3, 0.42 - lift * 0.003);
    const h = Math.min(460, Math.max(340, viewHeight - 360)),
      w = (h * tool.width) / tool.height;
    ctx.drawImage(tool, p.x - w * 0.5, p.y - h * 0.98 - lift, w, h);
    if (manual) crosshair(p);
    canvas.dataset.processPhase = down.toFixed(3);
    canvas.dataset.processCount = String(visibleHoles.length);
    return p;
  }
  function strokeBrand(distance: number, width: number, color: string) {
    ctx.beginPath();
    let remaining = distance;
    for (const segment of brandSegments) {
      if (remaining <= 0) break;
      const t = Math.min(1, remaining / segment.length);
      if (segment.cutting) {
        const a = projectPlate(segment.a, offset + pieceShift);
        const b = projectPlate(
          {
            x: segment.a.x + (segment.b.x - segment.a.x) * t,
            y: segment.a.y + (segment.b.y - segment.a.y) * t,
          },
          offset + pieceShift,
        );
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      remaining -= segment.length;
    }
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function drawWeld(dt: number, manual: boolean) {
    const progress = reduced ? 1 : Math.min(1, workClock / duration);
    const nearest = manual ? nearestBrandPoint(target) : null;
    const distance = nearest ? nearest.distance : progress * brandLength;
    const programmedDistance = progress * brandLength;
    const path = nearest ?? brandPointAt(distance);
    updatePosition(
      piecePhase === "working" ? path.point : { x: 0.87, y: 0.16 },
      dt,
    );
    strokeBrand(brandLength, 1.8, "rgba(19,49,34,.3)");
    strokeBrand(programmedDistance, 18, "rgba(103,74,113,.2)");
    strokeBrand(programmedDistance, 10, "rgba(179,132,75,.32)");
    strokeBrand(programmedDistance, 6, "#738079");
    const bead = ctx.createLinearGradient(0, offset + 400, 0, offset + 850);
    bead.addColorStop(0, "#d5d8c9");
    bead.addColorStop(0.5, "#b7beb0");
    bead.addColorStop(1, "#5f7268");
    for (let d = 0; d < programmedDistance; d += 12) {
      const point = brandPointAt(d);
      if (!point.cutting) continue;
      const p = projectPlate(point.point, offset + pieceShift);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 5.2, 3.6, -0.34, 0, Math.PI * 2);
      ctx.fillStyle = bead;
      ctx.fill();
      ctx.strokeStyle = "rgba(31,43,38,.4)";
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
    if (manual && dt && path.cutting) {
      manualBeads.set(Math.round(distance / 9), { ...path.point });
      if (manualBeads.size > 500) manualBeads.delete(manualBeads.keys().next().value!);
    }
    // Manual welds stay on the workpiece even when the torch moves backwards.
    for (const point of manualBeads.values()) {
      const q = projectPlate(point, offset + pieceShift);
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, 5.2, 3.6, -0.34, 0, Math.PI * 2);
      ctx.fillStyle = bead;
      ctx.fill();
    }
    const p = projectPlate(position, offset);
    shadow({ x: p.x + 80, y: p.y + 20 }, 130, 0.27);
    const welding = !reduced && piecePhase === "working" && path.cutting;
    if (welding) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.translate(p.x, p.y + 12);
      ctx.scale(1, 0.35);
      glow({ x: 0, y: 0 }, 170, "rgba(117,197,255,.4)");
      ctx.restore();
    }
    const w = 455,
      h = (w * tool.height) / tool.width;
    ctx.drawImage(tool, p.x - w * 0.128, p.y - h * 0.96 - 8, w, h);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    if (welding) {
      glow(p, 80, "rgba(104,189,255,.45)");
      glow(p, 28, "rgba(228,246,255,.94)");
      line({ x: p.x + 7, y: p.y - 16 }, p, "#eaf8ff", 3);
      ctx.fillStyle = "#fffdf2";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 7, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (dt && !reduced && welding) {
      emission += dt * 68;
      while (emission >= 1 && particles.length < 100) {
        emission--;
        const angle = Math.random() * Math.PI * 2,
          speed = 70 + Math.random() * 270;
        const life = 0.22 + Math.random() * 0.45;
        particles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.6 - 70,
          life,
          total: life,
        });
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const spark = particles[i];
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vy += 180 * dt;
      if (spark.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      line(
        spark,
        { x: spark.x - spark.vx * 0.024, y: spark.y - spark.vy * 0.024 },
        `rgba(255,196,111,${spark.life / spark.total})`,
        1.3,
      );
    }
    ctx.restore();
    if (manual) crosshair(p);
    canvas.dataset.processPhase = (distance / brandLength).toFixed(3);
    return p;
  }
  function metalSheet(points: Point[], reverse: boolean) {
    const shine = ctx.createLinearGradient(
      170,
      points[0].y - 100,
      770,
      points[0].y + 130,
    );
    shine.addColorStop(0, "#7e8f89");
    shine.addColorStop(0.23, "#d9e1db");
    shine.addColorStop(0.48, reverse ? "#788a82" : "#9aa9a1");
    shine.addColorStop(0.7, "#e3e6df");
    shine.addColorStop(1, "#657a70");
    polygon(points, shine, "rgba(231,242,229,.8)");
    ctx.save();
    ctx.clip();
    for (let i = -200; i < 260; i += 3) {
      line(
        { x: 70, y: points[0].y + i },
        { x: 1000, y: points[0].y + i - 165 },
        i % 9 ? "rgba(15,40,29,.07)" : "rgba(245,249,237,.14)",
        0.65,
      );
    }
    // Carry the original mark continuously across both sheet-metal wings.
    const a = points[0],
      b = points[1],
      d = points[3];
    ctx.beginPath();
    for (const contour of brandContours) {
      contour.forEach((point, index) => {
        const u = 0.18 + ((point.x - 0.13) / 0.74) * 0.64;
        const originalY = 0.14 + ((point.y - 0.17) / 0.66) * 0.72;
        const v = reverse ? originalY * 2 : (originalY - 0.5) * 2;
        const x = a.x + (b.x - a.x) * u + (d.x - a.x) * v;
        const y = a.y + (b.y - a.y) * u + (d.y - a.y) * v;
        if (index) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(14,54,35,.5)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(222,238,221,.48)";
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.restore();
  }
  function drawBend(dt: number, manual: boolean) {
    const automatic = smooth((workClock - 0.85) / 2.6);
    const desired = reduced
      ? 1
      : manual
        ? clamp((target.y - 0.15) / 0.7)
        : automatic;
    if (!paused) {
      const retained = piecePhase === "working" ? desired : Math.max(fold, desired);
      fold += (retained - fold) * (dt ? 1 - Math.exp(-dt * 7) : 1);
    }
    const angle = (fold * Math.PI) / 4,
      depth = fold * 53;
    const a = { x: 175, y: viewHeight * 0.69 },
      b = { x: 820, y: viewHeight * 0.69 - 118 };
    const shift = (p: Point, x: number, y: number): Point => ({
      x: p.x + x,
      y: p.y + y,
    });
    shadow({ x: 510, y: a.y + 110 }, 390, 0.45);
    const face = ctx.createLinearGradient(0, a.y, 0, a.y + 150);
    face.addColorStop(0, "#98a29a");
    face.addColorStop(0.12, "#53675d");
    face.addColorStop(0.4, "#243c32");
    face.addColorStop(1, "#10251c");
    polygon(
      [
        shift(a, -55, 40),
        shift(b, 55, 20),
        shift(b, 55, 125),
        shift(a, -55, 145),
      ],
      face,
      "#60766a",
    );
    polygon(
      [
        shift(a, -55, 40),
        shift(b, 55, 20),
        shift(b, 0, -18),
        shift(a, -110, 2),
      ],
      "#78867d",
      "#a7b5aa",
    );
    line(shift(a, -20, 20), shift(b, 25, -2), "#0b1d15", 25);
    line(shift(a, -20, 4), shift(b, 25, -18), "#ced4c8", 2);
    // Both wings lift as the punch depresses the bend line into the V die.
    const ca = shift(a, 0, depth),
      cb = shift(b, 0, depth);
    const rearX = -115 * Math.cos(angle),
      rearY = -94 * Math.cos(angle) - 185 * Math.sin(angle);
    const frontX = 130 * Math.cos(angle),
      frontY = 106 * Math.cos(angle) - 185 * Math.sin(angle);
    ctx.save();
    ctx.translate(0, pieceShift);
    metalSheet(
      [shift(ca, rearX, rearY), shift(cb, rearX, rearY), cb, ca],
      true,
    );
    metalSheet(
      [ca, cb, shift(cb, frontX, frontY), shift(ca, frontX, frontY)],
      false,
    );
    line(ca, cb, "rgba(233,243,228,.8)", 2.5);
    line(
      shift(ca, frontX, frontY + 4),
      shift(cb, frontX, frontY + 4),
      "#445d50",
      4,
    );
    ctx.restore();
    const separation =
      piecePhase !== "working" ? 100 : 75 * (1 - smooth(fold * 4));
    const tipA = shift(ca, 0, -separation - 3);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const w = length / 0.89,
      h = (w * tool.height) / tool.width;
    ctx.save();
    ctx.translate(tipA.x, tipA.y);
    ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
    ctx.drawImage(tool, -w * 0.055, -h * 0.814, w, h);
    ctx.restore();
    canvas.dataset.processPhase = fold.toFixed(3);
    canvas.dataset.bendAngle = (fold * 90).toFixed(1);
    return { x: (ca.x + cb.x) / 2, y: (ca.y + cb.y) / 2 };
  }
  function crosshair(p: Point) {
    ctx.save();
    ctx.setLineDash([3, 5]);
    line(
      { x: p.x - 23, y: p.y },
      { x: p.x + 23, y: p.y },
      "rgba(232,249,237,.45)",
      1,
    );
    line(
      { x: p.x, y: p.y - 23 },
      { x: p.x, y: p.y + 23 },
      "rgba(232,249,237,.45)",
      1,
    );
    ctx.restore();
  }
  function draw(time: number, dt: number) {
    if (!alive || !loaded) return;
    ctx.setTransform(canvas.width / 1000, 0, 0, canvas.width / 1000, 0, 0);
    ctx.fillStyle = "#102a26";
    ctx.fillRect(0, 0, 1000, viewHeight);
    const cycle = workpieceCycle(elapsed, duration, viewHeight + 450);
    if (
      cycle.index !== pieceIndex ||
      (cycle.phase === "loading" && piecePhase !== "loading")
    ) {
      holes.length = particles.length = 0;
      manualBeads.clear();
      punchCycle = -1;
      lastPunch = -1;
      fold = 0;
    }
    pieceIndex = cycle.index;
    piecePhase = reduced ? "complete" : cycle.phase;
    const report = `${piecePhase}:${cycle.index}`;
    if (report !== reportedCycle) {
      reportedCycle = report;
      callbacks.cycle?.(piecePhase, cycle.index);
    }
    pieceShift = reduced ? 0 : cycle.shift;
    workClock = reduced ? duration : cycle.workTime;
    const manual = manualUntil > time && !reduced && piecePhase === "working";
    if (manual !== isManual) {
      isManual = manual;
      callbacks.mode(manual);
    }
    let p: Point;
    if (process === "bending") {
      const lighting = ctx.createRadialGradient(
        530,
        viewHeight * 0.54,
        40,
        530,
        viewHeight * 0.54,
        550,
      );
      lighting.addColorStop(0, "#214d3c");
      lighting.addColorStop(1, "#102a26");
      ctx.fillStyle = lighting;
      ctx.fillRect(0, 0, 1000, viewHeight);
      p = drawBend(dt, manual);
    } else {
      drawWorkpieceBed(ctx, bed, offset, pieceShift);
      p = process === "punching" ? drawPunch(dt, manual) : drawWeld(dt, manual);
    }
    if (dt) {
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
    }
    root.style.setProperty("--scene-rx", `${tiltX.toFixed(3)}deg`);
    root.style.setProperty("--scene-ry", `${tiltY.toFixed(3)}deg`);
    canvas.dataset.pattern = "fasttrack-mark";
    canvas.dataset.process = process;
    canvas.dataset.workpiecePhase = piecePhase;
    canvas.dataset.workpieceIndex = String(cycle.index);
    canvas.dataset.workpieceShift = pieceShift.toFixed(2);
    canvas.dataset.clock = elapsed.toFixed(3);
    canvas.dataset.processX = p.x.toFixed(1);
    canvas.dataset.processY = p.y.toFixed(1);
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
    const rect = root.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width),
      y = clamp((clientY - rect.top) / rect.height);
    if (process === "bending") target = { x, y };
    else {
      const px = x * 1000 - 67,
        py = y * viewHeight - 633 - offset;
      const det = 553 * 277 + 353 * 193;
      target = {
        x: clamp((277 * px - 353 * py) / det, 0.15, 0.86),
        y: clamp((193 * px + 553 * py) / det, 0.18, 0.82),
      };
    }
    manualUntil = performance.now() + 3500;
    targetTiltX = (0.5 - y) * 2;
    targetTiltY = (x - 0.5) * 3;
    wake();
  }
  function onVisibility() {
    if (document.hidden) stop();
    else wake();
  }
  function onPreference() {
    reduced = preference.matches;
    callbacks.reduced(reduced);
    manualUntil = 0;
    targetTiltX = targetTiltY = tiltX = tiltY = 0;
    particles.length = 0;
    stop();
    draw(performance.now(), 0);
    wake();
  }
  document.addEventListener("visibilitychange", onVisibility);
  preference.addEventListener("change", onPreference);
  let completed = 0;
  const expected = process === "bending" ? 1 : 2;
  const onLoad = () => {
    if (++completed === expected && alive) {
      loaded = true;
      resize();
      callbacks.ready();
      wake();
    }
  };
  tool.onload = onLoad;
  bed.onload = onLoad;
  tool.onerror = bed.onerror = () => {
    if (alive) callbacks.unavailable();
  };
  tool.src = toolAssets[process];
  if (process !== "bending") bed.src = "/images/laser-bed.webp";
  return {
    point: pointer,
    leave() {
      manualUntil = 0;
      targetTiltX = targetTiltY = 0;
      wake();
    },
    nudge(dx, dy) {
      if (paused || reduced) return;
      if (!isManual)
        target =
          process === "bending"
            ? { x: 0.5, y: fold * 0.7 + 0.15 }
            : { ...position };
      target = {
        x: clamp(target.x + dx, 0.15, 0.86),
        y: clamp(target.y + dy, 0.15, 0.85),
      };
      if (process === "bending" && dx)
        target.y = clamp(target.y + dx, 0.15, 0.85);
      if (process === "welding" && dy)
        target.x = clamp(target.x + dy, 0.15, 0.86);
      manualUntil = performance.now() + 5000;
      wake();
    },
    pause(value) {
      paused = value;
      stop();
      particles.length = 0;
      draw(performance.now(), 0);
      wake();
    },
    automatic() {
      manualUntil = 0;
      targetTiltX = targetTiltY = 0;
      callbacks.mode(false);
      wake();
    },
    reset() {
      elapsed = 0;
      reportedCycle = "";
      punchCycle = -1;
      manualBeads.clear();
      lastPunch = -1;
      manualUntil = emission = 0;
      holes.length = particles.length = 0;
      manualBeads.clear();
      punchCycle = -1;
      pieceIndex = pieceShift = workClock = 0;
      piecePhase = "working";
      position =
        process === "welding"
          ? { ...brandPointAt(0).point }
          : { ...punchPattern[0] };
      fold = 0;
      draw(performance.now(), 0);
      wake();
    },
    destroy() {
      alive = false;
      stop();
      visibility.disconnect();
      dimensions.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      preference.removeEventListener("change", onPreference);
      bed.onload = tool.onload = bed.onerror = tool.onerror = null;
    },
  };
}
