// OWNED BY YOU. Pure rules: no DOM, clock, randomness or I/O, and never mutate an input.
//
//   initialState(config)                 -> a fresh state for the validated configuration
//   evaluate(config, state, action)      -> { accepted, reason, state }
//
// Route: "range" (Dragon's Last Stand). Every accepted shot uses one arrow; a hit also scores one.
// Using the last arrow completes the game. Rejected actions return the state unchanged.

import type { RangeConfig } from "./supplied/config.js";
import type { GameAction, GameState, RejectReason, RuleResult } from "./models.js";

/** A fresh game: every arrow in the quiver, nothing scored, nothing shot. */
export function initialState(config: RangeConfig): GameState {
   return {
    ammunition: config.ammunition,
    score: 0,
    shots: 0,
    status: config.ammunition === 0 ? "complete" : "active",
  };
}

/** Apply one action to a state and return a NEW state (or the same one, if rejected). */
export function evaluate(config: RangeConfig, state: GameState, action: GameAction): RuleResult {
  // 1. Nothing changes once the game is over, whatever arrives (checked first).
  if (isFinished(state)) return reject("GAME_COMPLETE", state);

  // 2. Only the two panel actions are permitted. The type says so, but data from outside
  //    (a test, a stray message) can still carry another word, so check at run time too.
  if (action.type !== "hit" && action.type !== "miss") return reject("INVALID_EVENT", state);

  // 3. An accepted shot: one arrow used, one shot counted, one point only for a hit.
  const ammunition = state.ammunition - 1;
  return {
    accepted: true,
    reason: null,
    state: {
      ammunition,
      score: state.score + (action.type === "hit" ? 1 : 0),
      shots: state.shots + 1,
      status: ammunition === 0 ? "complete" : "active",
    },
  };
}

/** True when no further action can be accepted (used by the app to disable the action buttons). */
export function isFinished(state: GameState): boolean {
  return state.status === "complete";
}

/** A rejection keeps the caller's state exactly as it was. */
function reject(reason: RejectReason, state: GameState): RuleResult {
  return { accepted: false, reason, state };
}
