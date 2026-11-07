import { projectPlate } from "./plate-projection";
/** Reuse the approved plate photograph as a moving, clipped workpiece. */
export function drawWorkpieceBed(
  ctx: CanvasRenderingContext2D,
  bed: HTMLImageElement,
  offset: number,
  shift: number,
) {
  ctx.drawImage(bed, 0, offset, 1000, 1000);
  const corners = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ].map((p) => projectPlate(p, offset));
  const path = () => {
    ctx.beginPath();
    corners.forEach((p, i) =>
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
    );
    ctx.closePath();
  };
  // Exposed support bed beneath the outgoing plate; the plate itself is a separate layer.
  ctx.save();
  path();
  ctx.fillStyle = "#0b211b";
  ctx.fill();
  ctx.clip();
  for (let i = -200; i < 1300; i += 36) {
    ctx.beginPath();
    ctx.moveTo(i, offset + 420);
    ctx.lineTo(i + 480, offset + 1050);
    ctx.strokeStyle = "#294237";
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = "#071811";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(0, shift);
  path();
  ctx.clip();
  ctx.drawImage(bed, 0, offset, 1000, 1000);
  ctx.restore();
}
