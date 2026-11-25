// OWNED BY YOU. The application adapter: load -> start -> dispatch -> restart.
// Game: Dragon's Last Stand (range route).

import { GENRE } from "./genre.js";
import { loadConfig } from "./api.js";
import { evaluate, initialState, isFinished } from "./rules.js";
import type { GameAction, GameState } from "./models.js";

import type { RangeConfig } from "./supplied/config.js";
import { connect, playable } from "./supplied/controls.js";
import { identify, paint, text } from "./supplied/render.js";
import { newRunId, recordEvent } from "./supplied/telemetry.js";

// The waiter's notepad: what we remember between button presses.
let config: RangeConfig | null = null; // verified game data (null until it arrives)
let state: GameState | null = null;    // the current game (null until Start)
let runId = "";                        // a new ID for every start/restart
let sequence = 0;

/** Ask the server for the game data. On failure, keep whatever we already had. */
async function load(): Promise<void> {
  text("api", "Loading game data...");
  try {
    const fresh = await loadConfig();
    config = fresh; // only replace the data once the new data is verified
    text("api", `Game data verified: ${fresh.name}`);
  } catch (error) {
    // Transport problems go in the "api" box only. config and state stay as they were.
    text("api", error instanceof Error ? error.message : "Game data request failed");
  }
}


/** Begin a fresh game from the verified data. */
function start(): void {
  if (config === null) {
    text("status", "No verified game data yet, so the game can't start");
    return;
  }
  state = initialState(config);
  runId = newRunId();
  sequence = 0;
  identify(runId);
  paint(state);
  playable(true);
  text("status", `The dragon approaches! You have ${state.ammunition} enchanted arrows.`);
  text("result", "No shot yet");
  text("telemetry", "No event recorded yet");
}
/** One button press: ask the rules, keep what they return, paint it. */
function dispatch(action: GameAction): void {
  if (config === null || state === null) {
    text("status", "Press Start game first");
    return;
  }
  const before = state;
  const result = evaluate(config, before, action);
  state = result.state; // keep exactly what the rules returned
  paint(state);         // and paint that same state

  if (result.accepted) {
    text("result", action.type === "hit" ? "Hit! The arrow strikes the dragon." : "Miss! The arrow flies into the clouds.");
  } else {
    text("result", `Rejected: ${result.reason}`);
  }

  if (isFinished(state)) {
    playable(false);
    text("status", `Your quiver is empty. You struck the dragon ${state.score} of ${state.shots} times.`);
  } else {
    text("status", `${state.ammunition} enchanted arrow(s) left.`);
  }

  const event = {
    runId,
    sequence: ++sequence,
    action: action.type,
    accepted: result.accepted,
    before,
    after: result.state,
  };
  text("telemetry", "Recording locally...");
  void recordEvent(event).then(
    () => {
      if (runId === event.runId && sequence === event.sequence) {
        text("telemetry", "Recorded locally");
      }
    },
    (error: unknown) => {
      console.error("Local recording unavailable", error);
      // A delayed reply must not replace the message for a newer shot or restarted game.
      if (runId === event.runId && sequence === event.sequence) {
        text("telemetry", "Local recording unavailable");
      }
    },
  );
}

connect(GENRE, {
  dispatch,
  start,
  restart: start,
  reload: () => void load(),
});

playable(false);
text("status", "Press Start game to face the dragon");
void load();
