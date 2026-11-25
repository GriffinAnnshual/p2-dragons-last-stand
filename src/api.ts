// OWNED BY YOU. Request the game data, separate HTTP and JSON failures, and call parseConfig.
//
// Route: GET /api/boards/reference (treasure) or GET /api/ranges/reference (range), same origin.
// Report each failure kind with its own message: network/HTTP failure, malformed JSON, and an
// unexpected definition (parseConfig throws ConfigError). Transport problems are not game status.

import { GENRE } from "./genre.js";
import { parseConfig, type ConfigFor } from "./supplied/config.js";

export async function loadConfig(): Promise<ConfigFor<typeof GENRE>> {
  // Stage 0: reach the server at all.
  let response: Response;
  try {
    response = await fetch("/api/ranges/reference");
  } catch {
    throw new Error("Game data request failed: the server could not be reached");
  }

  // Stage 1: the server answered, but with an error status (e.g. 503).
  if (!response.ok) {
    throw new Error(`Game data request failed: HTTP ${response.status}`);
  }

  // Stage 2: the body must be valid JSON.
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Game data is malformed: the response is not valid JSON");
  }

  // Stage 3: the JSON must be exactly the reference range.
  // parseConfig throws ConfigError, e.g. "Unexpected game definition: ...".
  return parseConfig(GENRE, data);
}


