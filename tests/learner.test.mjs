// OWNED BY YOU. Your changed-input regression with an INDEPENDENT expected value.
//
// The contract fixtures cover: start (R01), hit (R02), miss (R03), completing with a HIT (R04),
// an unknown event while active (R05A) and a HIT after completion (R05B).
// These tests change an input the fixtures do not cover. Each expected value was worked out by hand
// from the brief BEFORE running, and each test checks the whole result and that the input is unchanged.
//
// Run with: npm run check:rules   (it builds first, then imports the compiled rules from dist/)

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConfig } from "../dist/supplied/config.js";
import { evaluate, initialState } from "../dist/rules.js";

const config = parseConfig("range", { id: "reference", name: "Reference target range", ammunition: 2 });

/** Freeze every nested object so an accidental mutation throws instead of passing silently. */
function deepFreeze(value) {
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test("learner regression: a MISS with the last arrow completes the game without scoring", () => {
  // Brief: a miss uses one arrow and scores nothing; using the last arrow completes the game.
  // By hand: 1 arrow, score 1, 1 shot -> 0 arrows, score still 1, 2 shots, complete.
  const before = deepFreeze({ ammunition: 1, score: 1, shots: 1, status: "active" });
  const snapshot = JSON.stringify(before);

  const result = evaluate(config, before, deepFreeze({ type: "miss" }));

  assert.deepStrictEqual(result, {
    accepted: true,
    reason: null,
    state: { ammunition: 0, score: 1, shots: 2, status: "complete" },
  });
  assert.equal(JSON.stringify(before), snapshot, "evaluate() must not mutate its input state");
});

test("learner regression: an UNKNOWN event after completion is rejected as GAME_COMPLETE", () => {
  // Brief: once the game is complete nothing more can change. R05A covers an unknown event while
  // active, and R05B covers a hit after completion; this combines both. By hand: the completed check
  // comes first, so the reason is GAME_COMPLETE (not INVALID_EVENT) and the state is unchanged.
  const before = deepFreeze({ ammunition: 0, score: 2, shots: 2, status: "complete" });
  const snapshot = JSON.stringify(before);

  const result = evaluate(config, before, deepFreeze({ type: "reload" }));

  assert.deepStrictEqual(result, {
    accepted: false,
    reason: "GAME_COMPLETE",
    state: { ammunition: 0, score: 2, shots: 2, status: "complete" },
  });
  assert.equal(JSON.stringify(before), snapshot, "evaluate() must not mutate its input state");
});

test("learner regression: a full game played from the start is deterministic", () => {
  // Brief: start with 2 arrows; hit then miss. By hand: score 1, 0 arrows, 2 shots, complete.
  // Running the same inputs twice must give the same answer (no clock or randomness in the rules).
  const play = () => {
    const start = deepFreeze(initialState(config));
    const afterHit = evaluate(config, start, { type: "hit" });
    const afterMiss = evaluate(config, deepFreeze(afterHit.state), { type: "miss" });
    return [start, afterHit, afterMiss];
  };

  const [start, afterHit, afterMiss] = play();
  assert.deepStrictEqual(start, { ammunition: 2, score: 0, shots: 0, status: "active" });
  assert.deepStrictEqual(afterHit.state, { ammunition: 1, score: 1, shots: 1, status: "active" });
  assert.deepStrictEqual(afterMiss, {
    accepted: true,
    reason: null,
    state: { ammunition: 0, score: 1, shots: 2, status: "complete" },
  });
  assert.deepStrictEqual(play(), [start, afterHit, afterMiss], "same inputs must give the same results");
});

test("assisted regression: a last-arrow miss completes a zero-score game", () => {
  const before = deepFreeze({ ammunition: 1, score: 0, shots: 1, status: "active" });
  const result = evaluate(config, before, deepFreeze({ type: "miss" }));

  assert.deepStrictEqual(result, {
    accepted: true,
    reason: null,
    state: { ammunition: 0, score: 0, shots: 2, status: "complete" },
  });
  assert.deepStrictEqual(before, { ammunition: 1, score: 0, shots: 1, status: "active" });
});
