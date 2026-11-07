import test from "node:test";
import assert from "node:assert/strict";
import * as module from "../src/lib/journey-state.mjs";
test("six stage shortcuts select the actual rendered machine stage", () => {
  [0, 0.25, 0.43, 0.61, 0.78, 1].forEach((p, index) =>
    assert.equal(module.manufacturingState(p).stageIndex, index),
  );
});
test("interior shelf stays within the cabinet throughout assembly and the finished reveal", () => {
  const { halfWidth, bottom, top, back, front, shelfSize } = module.cabinetInterior;
  assert.equal(module.interiorShelfState(0.69).visible, false);
  for (let i = 0; i <= 1000; i++) {
    const shelf = module.interiorShelfState(i / 1000);
    if (!shelf.visible) continue;
    const [x, y, z] = shelf.position;
    assert.ok(x - shelfSize[0] / 2 > -halfWidth);
    assert.ok(x + shelfSize[0] / 2 < halfWidth);
    assert.ok(y - shelfSize[1] / 2 > bottom && y + shelfSize[1] / 2 < top);
    assert.ok(z - shelfSize[2] / 2 > back && z + shelfSize[2] / 2 < front);
  }
  assert.equal(module.interiorShelfState(1).installed, 1);
});
test("continuous folds never reverse and assembly is introduced after the panel forms", () => {
  let left = 0,
    right = 0;
  for (let i = 0; i <= 1000; i++) {
    const state = module.manufacturingState(i / 1000);
    assert.ok(state.foldLeft >= left && state.foldRight >= right);
    assert.ok(state.phase >= 0 && state.phase <= 1);
    left = state.foldLeft;
    right = state.foldRight;
  }
  const finish = module.manufacturingState(1);
  assert.equal(finish.foldLeft, 1);
  assert.equal(finish.foldRight, 1);
  assert.equal(finish.doors, 1);
  assert.equal(module.manufacturingState(NaN).progress, 0);
});
