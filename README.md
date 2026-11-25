# Dragon's Last Stand

A small, playable browser game built in TypeScript for **Project 2 (Playable TypeScript game)** of the BP Software
Engineering Academy, Week 2. It follows the course's **target-range** route.

## The game

The last dragon is attacking and the hero has a quiver of enchanted arrows. Each turn the hero fires one arrow, and
the shot is recorded as a **hit** or a **miss**.

| Rule | Behaviour |
|---|---|
| Start | The quiver holds the number of arrows set by the game data (2 in the reference range); score 0, shots 0 |
| Hit | Uses one arrow and scores one point |
| Miss | Uses one arrow and scores nothing |
| Finish | The game is complete as soon as the last arrow is used, whether that shot hits or misses |
| Rejected actions | An unknown action, or any shot after the game is complete, is rejected and the state stays exactly as it was (`INVALID_EVENT`, `GAME_COMPLETE`) |
| Restart | Starts a fresh game from the initial state, with a new run ID |

Game state is `ammunition`, `score`, `shots` and `status` (`active` or `complete`). The rules are pure functions
(`initialState` and `evaluate` in `src/rules.ts`), independent of the page, the clock and randomness, so the same
sequence of shots always gives the same result.

## Project structure

| Path | Purpose |
|---|---|
| `src/genre.ts` | Selects the `range` route |
| `src/models.ts` | Typed game state, actions, reject reasons and the result envelope, with their invariants |
| `src/rules.ts` | `initialState(config)` and `evaluate(config, state, action)` |
| `src/api.ts` | Loads the game data from `GET /api/ranges/reference`, reporting HTTP, malformed-JSON and unexpected-definition failures |
| `src/app.ts` | Load, start, dispatch, restart and event recording in the browser |
| `src/supplied/` | Course-supplied controls, renderer, configuration guard, telemetry and event view |
| `server/` | Course-supplied local host: page, game-data API, event collector and `/healthz` |
| `tests/learner.test.mjs` | Regression tests for this game |
| `tests/fixtures.test.mjs`, `fixtures/` | Course contract fixtures (range R01–R05B) |
| `tests/browser/` | Browser checks: lifecycle, request failures and recorded events |
| `tools/release.py` | Packs and verifies a named local release |

## Setup

Requirements: Node.js 22 or later, npm, Python 3. On Windows use `python` where the commands say `python3`.

```bash
npm ci                              # install the pinned dependencies (TypeScript 5.9.3, Playwright 1.61.0)
npx playwright install chromium     # once per machine, for the browser checks
npm start                           # build and serve the game at http://127.0.0.1:4182
```

Open `http://127.0.0.1:4182`, press **Start**, then use **Hit** and **Miss** until the quiver is empty, and
**Restart** for a new game. The local event view is at `http://127.0.0.1:4182/events.html`. Stop the server with
Ctrl+C. To use another port: `PORT=4183 npm start`.

## Checks

```bash
npm run check:boot      # the page, styles, modules, game-data routes, collector and /healthz all start
npm run check:rules     # contract fixtures and regression tests
npm test                # rule checks, then the browser checks (stop npm start first; the tests start their own server)
```

## Local release

```bash
npm test
python3 tools/release.py pack ../releases/playable-01
python3 tools/release.py verify ../releases/playable-01
python3 ../releases/playable-01/serve.py
P2_URL=http://127.0.0.1:4182 npm run check:browser    # check the running release
```

The release holds the compiled browser code, the local API and a SHA-256 inventory in `release.json`. Responses carry
an `X-Lab-Release` header naming the release. This is a local release, not a container, Kubernetes or BP deployment.

## Evidence

Results recorded in this repository:

| Check | Result | Record |
|---|---|---|
| Rule tests (`npm run check:rules`) | 10 passed, 0 failed, 13 skipped (the skipped tests are the treasure-hunt fixtures, which don't apply to the range route) | `npm-test.log` |
| Range contract fixtures | R01 start, R02 hit, R03 miss, R04 last arrow completes, R05A unknown event rejected, R05B shot after completion rejected: all pass | `npm-test.log` |
| Regression tests | last-arrow miss completes without scoring; unknown event after completion is `GAME_COMPLETE`; a full game is deterministic | `npm-test.log` |
| Browser checks (`npm run check:browser`) | 10 passed, 1 skipped: start, play, finish and fresh restart; visible loading; HTTP, malformed-JSON and unexpected-definition failures reported without starting a game; failed reload keeps the session; events recorded and visible, with collector failure reported without undoing the action | `npm-test.log` |
| Release pack | `playable-01` (range): 47 files packed | `release-pack.log` |
| Release verify | 47 files match `release.json` (SHA-256), before and after running | `release-verify.log`, `release-verify-after.log` |
| Running release | `X-Lab-Release: playable-01` | `release-header.log`, `release-browser.log` |

Full outcome-by-outcome notes are in [`evidence.md`](evidence.md).
