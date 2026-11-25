// OWNED BY YOU. Precise state and action types, and the invariants they must keep.
//
// Route: "range" (see src/genre.ts). Game identity: Dragon's Last Stand. The hero has a fixed
// number of enchanted arrows (the range's "ammunition"); each shot is recorded as a hit or a miss.
// Field names match the range contract fixtures R01-R05B exactly, because the renderer and the
// fixtures compare these objects field by field.

/** The two statuses a range game can be in. */
export type RangeStatus = "active" | "complete";

/** The game state the rules return and the page paints. */
export interface GameState {
  /** Arrows left. Invariant: 0 <= ammunition, and ammunition + shots === config.ammunition. */
  readonly ammunition: number;
  /** Hits so far. Invariant: 0 <= score <= shots (only a hit adds to the score). */
  readonly score: number;
  /** Shots taken so far (hits plus misses). Invariant: shots only ever goes up, by one per accepted shot. */
  readonly shots: number;
  /** Invariant: "complete" exactly when ammunition === 0; once complete, no shot is accepted. */
  readonly status: RangeStatus;
}

/** One permitted player action: the two buttons on the supplied range panel. */
export type GameAction = { readonly type: "hit" } | { readonly type: "miss" };

/** Why a shot was rejected. The page shows this word in the result region. */
export type RejectReason =
  | "INVALID_EVENT" // the action is not "hit" or "miss" (e.g. "reload" arriving from outside the panel)
  | "GAME_COMPLETE"; // the game is already complete, so nothing more can change

/**
 * The result envelope every evaluate() call returns: { accepted, reason, state }.
 * The union makes a mismatched pair impossible: an accepted result always has reason null,
 * and a rejected result always names a reason.
 */
export type RuleResult =
  | { readonly accepted: true; readonly reason: null; readonly state: GameState }
  | { readonly accepted: false; readonly reason: RejectReason; readonly state: GameState };
