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
  // A separate bright edge and underside make the blank read as real moving stock.
  ctx.save();
  ctx.translate(0, shift);
  path();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "rgba(224,239,229,.62)";
  ctx.stroke();
  ctx.translate(0, 4);
  ctx.beginPath();
  ctx.moveTo(corners[2].x, corners[2].y);
  ctx.lineTo(corners[3].x, corners[3].y);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(15,29,24,.8)";
  ctx.stroke();
  ctx.restore();
  // Fixed hold-down shoes stay with the machine while the sheet is exchanged.
  for (const point of [corners[0], corners[1]]) {
    const metal = ctx.createLinearGradient(point.x - 14, point.y - 28, point.x + 16, point.y + 9);
    metal.addColorStop(0, "#b6c5bc");
    metal.addColorStop(.45, "#52685d");
    metal.addColorStop(1, "#1a3026");
    ctx.fillStyle = metal;
    ctx.fillRect(point.x - 15, point.y - 24, 30, 30);
    ctx.strokeStyle = "#d3e1d6";
    ctx.lineWidth = 1;
    ctx.strokeRect(point.x - 15, point.y - 24, 30, 30);
  }
}
