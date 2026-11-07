import test from "node:test";
import assert from "node:assert/strict";
import * as module from "../src/lib/journey-state.mjs";
test("six stage shortcuts select the actual rendered machine stage", () => {
  [0, 0.25, 0.43, 0.61, 0.78, 1].forEach((p, index) =>
    assert.equal(module.manufacturingState(p).stageIndex, index),
  );
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
