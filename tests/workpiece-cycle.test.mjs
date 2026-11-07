import test from "node:test";
import assert from "node:assert/strict";
import { workpieceCycle } from "../src/lib/workpiece-cycle.mjs";
test("finished part exits completely before a fresh blank loads", () => {
  assert.equal(workpieceCycle(4, 4).phase, "complete");
  const exit = workpieceCycle(6.59999, 4);
  assert.equal(exit.phase, "ejecting");
  assert.ok(exit.shift > 1099);
  const blank = workpieceCycle(6.6, 4);
  assert.equal(blank.phase, "loading");
  assert.equal(blank.progress, 0);
  assert.ok(blank.shift < -1099);
  const next = workpieceCycle(7.8, 4);
  assert.equal(next.index, 1);
  assert.equal(next.phase, "working");
  assert.ok(next.progress < 0.001);
});
test("workpiece path is bounded and repeatable for long sessions", () => {
  for (let t = 0; t < 10000; t += 0.117) {
    const frame = workpieceCycle(t, 13);
    assert.ok(frame.progress >= 0 && frame.progress <= 1);
    assert.ok(Math.abs(frame.shift) <= 1100);
    assert.ok(frame.workTime >= 0 && frame.workTime <= 13);
  }
  assert.deepEqual(workpieceCycle(18, 13), workpieceCycle(18, 13));
});
