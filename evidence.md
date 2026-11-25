# Project 2 evidence: playable TypeScript game

Owned by you. Write, speak, annotate or record each response; a pair shares the artifact but gives two
individual responses. Record observations you actually made, not what you expected to see.

Learner id (synthetic, e.g. `learner-01`): Griffin  
Pair/team id (e.g. `p2-team-a`): p2-team-a  
Genre route chosen in `src/genre.ts` (`treasure` / `range`) and the game identity kept from your brief: `range` (FPS target-range slice). Game identity: **Dragon's Last Stand**, an adventure story on the range rules: a hero has two enchanted arrows to drive off a dragon.

### Evidence provenance

This synthetic record covers the planning, implementation, testing, debugging, browser verification, event recording and local release of **Dragon's Last Stand**.

The observations below represent the results of the commands, browser checks and scenarios described in this synthetic Project 2 exercise. Expected results in the plan are not used as substitutes for actual output within the scenario.

## 1. Plan check (Thursday PM, minute 0-20)

- Brief, minimum slice and acceptance examples brought from W2.10:
  - Minimum slice: the hero starts with 2 arrows and score 0. Each turn the player presses **hit** or **miss**.
  - Acceptance examples (range contract, fixtures R01-R05B):
    - Start: 2 arrows (`ammunition: 2`), `score: 0`, `shots: 0`, `status: "active"` (R01).
    - Hit: uses 1 arrow, score +1 (R02).
    - Miss: uses 1 arrow, score unchanged (R03).
    - Using the last arrow finishes the game (R04).
    - An unknown event is rejected and the state is unchanged (R05A).
    - Any event after the game has finished is rejected (R05B).
  - Out of scope: aiming, physics, graphics, levels, accounts, multiplayer.
- The seven outcomes and which owned file delivers each:

  | Outcome | Owned file |
  |---|---|
  | 1. Typed models | `src/models.ts` |
  | 2. Core logic with deterministic tests | `src/rules.ts`, `tests/learner.test.mjs` |
  | 3. Browser lifecycle (start, play, finish, restart) | `src/app.ts` |
  | 4. API loading and failure handling | `src/api.ts` (shown through `src/app.ts`) |
  | 5. Debugging with a regression | `tests/learner.test.mjs` plus the file holding the defect |
  | 6. One instrumented event | `src/app.ts` (the `recordEvent` call) |
  | 7. Local release | `tools/release.py` (supplied) -> `../releases/playable-01`; evidence here |

Route chosen in `src/genre.ts`: `export const GENRE = "range" satisfies Genre;`

## 2. Typed models (acceptance 1)

- Field names, permitted actions and one invariant (quote `src/models.ts`):
  - Fields of `GameState`: `ammunition`, `score`, `shots`, `status` (all `readonly`).
  - `status` is `RangeStatus = "active" | "complete"`.
  - Permitted actions: `GameAction = { readonly type: "hit" } | { readonly type: "miss" }`.
  - Reject reasons: `RejectReason = "INVALID_EVENT" | "GAME_COMPLETE"`.
  - Invariant: `status` is `"complete"` exactly when `ammunition === 0`; once complete, no shot is accepted.
  - Also: `ammunition + shots === config.ammunition`, and `0 <= score <= shots`.
- Incompatible value I tried, compiler diagnostic, and restored valid source:
  - In `src/rules.ts`, inside `initialState`, I put three wrong values into the starting state: `ammunition: true`, `score: "zero"` and `status: "paused"`. I also accidentally deleted the `shots: 0` line.
  - Running `npm run build` failed with three wrong-type errors:
    - `src/rules.ts:15:5 - error TS2322: Type 'boolean' is not assignable to type 'number'.`
    - `src/rules.ts:16:5 - error TS2322: Type 'string' is not assignable to type 'number'.`
    - `src/rules.ts:17:5 - error TS2322: Type '"paused"' is not assignable to type 'RangeStatus'.`
  - This showed that `GameState` stops invalid values before the game runs. `ammunition` and `score` must be numbers and `status` can only be `"active"` or `"complete"`.
  - I restored the original four lines: `ammunition: config.ammunition`, `score: 0`, `shots: 0`, `status: config.ammunition === 0 ? "complete" : "active"`.
  - After restoring them, `npm run build` showed no errors and `npm run check:rules` gave `tests 22 · pass 9 · fail 0 · skipped 13`.

## 3. Core logic (acceptance 2)

- `npm run check:rules` result (first red run, then green):
  - Baseline, unchanged starter (`GENRE = "treasure"`), Node 26.11.1: `tests 20 · pass 0 · fail 14 · skipped 6`.
  - After switching to `GENRE = "range"` before writing the rules: `tests 20 · pass 0 · fail 7 · skipped 13`.
  - Failed: R01, R02, R03, R04, R05A, R05B and the learner regression placeholder.
  - Green run after writing `src/models.ts`, `src/rules.ts` and `tests/learner.test.mjs`: `tests 22 · pass 9 · fail 0 · skipped 13`.
  - R01-R05B passed, plus 3 learner regressions. F01-F11 remained skipped because the range route was selected.
  - `check:boot` also passed.
  - Environment note: the course pins Node 22.23.2; this environment used Node 26.11.1 / npm 11.20.0. No setup errors were observed.
- Changed-input regression:
  - I used an active state with `ammunition: 1`, `score: 0`, `shots: 1`, `status: "active"` and action `miss`.
  - Before execution I expected `ammunition: 0`, `score: 0`, `shots: 2`, `status: "complete"`, accepted with no rejection reason.
  - The actual result matched: `{"ammunition":0,"score":0,"shots":2,"status":"complete"}` and the original input state remained unchanged.
- Evidence that inputs are unchanged and invalid/completed actions are rejected:
  - The learner tests freeze the input state and actions and check both the returned result and original state.
  - R05A rejects an unknown event while active as `INVALID_EVENT`.
  - R05B rejects a hit after completion as `GAME_COMPLETE`.
  - The learner regression also rejects an unknown event after completion as `GAME_COMPLETE`, with the state unchanged.
  - Latest run: `tests 23 · pass 10 · fail 0 · skipped 13`; retained in [npm-test.log](./npm-test.log).

## 4. Checkpoints

The minute-based entries below are checkpoints used to organise the exercise. The completion run subsequently verified the remaining technical outcomes.

- Minute 120: start / accepted / rejected checks:
  - `npm run check:rules` gives `pass 9 · fail 0 · skipped 13`.
  - Start is checked by R01.
  - Accepted shots are checked by R02 (hit), R03 (miss) and R04 (last arrow completes).
  - Rejected actions are checked by R05A (unknown event -> `INVALID_EVENT`) and R05B (shot after completion -> `GAME_COMPLETE`).
  - The learner regressions also pass. In each rejected case, the state remains unchanged.
- Minute 180: browser action rendered from returned state:
  - I ran `npm start` and opened `http://127.0.0.1:4182`.
  - The Game data box said `Game data verified: Reference target range`.
  - Start game showed `ammunition 2, score 0, shots 0, status active` with Hit and Miss enabled.
  - Hit showed `ammunition 1, score 1, shots 1, active`, `Hit! The arrow strikes the dragon.` and `1 enchanted arrow(s) left.`
  - Miss showed `ammunition 0, score 1, shots 2, complete`, `Miss! The arrow flies into the clouds.` and `Your quiver is empty. You struck the dragon 1 of 2 times.` Hit and Miss were disabled.
  - The page displays the state returned by `evaluate()`: `app.ts` stores `result.state` and passes that object to `paint()`.
  - The run ID stayed the same during one game and changed when I pressed Start game again.
- Minute 270:
  - Typed models, rules and browser lifecycle were complete.
  - I then completed the API failure checks, debugging regression, event recording and local release evidence.

## 5. Browser lifecycle (acceptance 3)

- Public start -> progress -> finish -> fresh restart:

  | # | What I did | What the page showed |
  |---|---|---|
  | 1 | Loaded the page | `Game data verified: Reference target range`; Hit and Miss disabled until Start |
  | 2 | Start game | Run ID `run-eeeeb0aa`; `ammunition 2, score 0, shots 0, status active` |
  | 3 | Hit | `Hit! The arrow strikes the dragon.`; `ammunition 1, score 1, shots 1, active` |
  | 4 | Miss | `Miss! The arrow flies into the clouds.`; `ammunition 0, score 1, shots 2, complete`; Hit and Miss disabled |
  | 5 | Restart | `ammunition 2, score 0, shots 0, active`; new run ID `run-4eddee37`; buttons enabled |
  | 6 | Hit, Hit | First hit: `1, 1, 1, active`; second hit: `ammunition 0, score 2, shots 2, complete` |

- Restart creates a fresh initial state from `initialState(config)` and a new run ID. It does not reuse the finished state.
- `npx playwright test tests/browser/lifecycle.spec.mjs` showed `1 passed, 1 skipped`.
  - `public start, progress, finish and fresh restart` passed in 1.5 s.
  - `a rejected action is reported and leaves the state unchanged` was skipped for the range route.
- Why the rejected-action browser check is skipped:
  - The range page exposes only Hit and Miss and both are valid while active.
  - Once the game completes, `playable(false)` disables both buttons.
  - Rejection behaviour is therefore covered by the deterministic rules tests.
  - R05A verifies `INVALID_EVENT`, R05B verifies `GAME_COMPLETE`, and the learner regression confirms the state remains unchanged.
  - If a rejection reached the UI, `dispatch` would show `Rejected: <reason>`.

## 6. API loading and failure (acceptance 4)

I exercised the supplied fault modes against the local host.

- Loading before response:
  - With `fault: "slow"`, the page displayed `Loading game data...` before `Game data verified: Reference target range`.
  - The supplied delay is 1,500 ms. Navigation-to-success took 1,994 ms including browser work, so this is not an exact measurement of the loading message duration.
- Success message: `Game data verified: Reference target range`.
- Failure observations:

  | Supplied fault | Exact Game data message | Result after pressing Start |
  |---|---|---|
  | `http` | `Game data request failed: HTTP 503` | State box stayed empty |
  | `malformed` | `Game data is malformed: the response is not valid JSON` | State box stayed empty |
  | `unexpected` | `Unexpected game definition: this package supports only the fixed reference definition` | State box stayed empty |

- In all three failed-start checks, the game status said `No verified game data yet, so the game can't start`.
- Failed reload kept the last confirmed session:
  - Start then Hit produced `ammunition: 1`, `score: 1`, `shots: 1`, `status: "active"`.
  - I restarted the local host on the same port with `fault: "http"` and pressed Reload without refreshing the page.
  - Game data showed `Game data request failed: HTTP 503`.
  - All four state fields and the run ID stayed unchanged.
  - Miss still worked afterwards and produced `ammunition: 0`, `score: 1`, `shots: 2`, `status: "complete"`.
- Request/event checks:
  - `npx playwright test tests/browser/request-failure.spec.mjs tests/browser/events.spec.mjs`
  - Result: `9 passed (13.4s)`.
  - Output: [api-events-check.log](./api-events-check.log).
- Raw observations: [evidence-observations.json](./evidence-observations.json).

## 7. Debugging (acceptance 5)

- Reproducible failing behaviour:
  - I started a verified game and pressed Hit.
  - The game state changed correctly, but the Local recording box remained `No event recorded yet`.
  - The regression expected `Recorded locally` and failed after its 5,000 ms assertion timeout.
- Responsible boundary and narrow correction:
  - `dispatch()` in `src/app.ts` evaluated and painted the shot but did not call `recordEvent`.
  - I connected the recording path at that boundary, retained the pre-action state and sent `{ runId, sequence, action, accepted, before, after }` after each evaluated action.
  - Start/Restart resets the sequence to zero and the first shot uses sequence one.
  - Successful recording displays `Recorded locally`.
  - Recording failure is logged and displays `Local recording unavailable`.
  - Recording status never changes or undoes the rules result.
  - Delayed replies are ignored for the displayed message when a newer action or restarted run has replaced them.
  - I added a regression verifying that a delayed failure cannot overwrite the status for a fresh restart.
- Same regression failing before and passing after:

  Command:

  `npx playwright test tests/browser/events.spec.mjs -g "an actual action is recorded and visible"`

  Before:

  ```text
  Expected: "Recorded locally"
  Received: "No event recorded yet"
  Timeout: 5000ms
  1 failed
  ```

  After:

  ```text
  an actual action is recorded and visible in the local event view
  1 passed (9.6s)
  ```

- Retained output: [debug-before.log](./debug-before.log) and [debug-after.log](./debug-after.log).
- No diagnostic variant was needed because the missing-recording behaviour gave me a real reproducible defect to trace and correct.

## 8. Event (acceptance 6)

- Event evidence was saved before stopping the local collector:
  - Displayed run ID: `run-a176e1d0`.
  - Sequence: `1`.
  - Action: `hit`.
  - Acceptance: `accepted` (`true` in JSON).
  - After the shot, the Local recording box showed `Recorded locally`.
  - The Local event view filtered to the run ID and showed one matching row.
- Saved row text:

  ```text
  2026-11-23T11:59:50.930Zrun-a176e1d01hitaccepted{"ammunition":2,"score":0,"shots":0,"status":"active"}{"ammunition":1,"score":1,"shots":1,"status":"active"}
  ```

- Parsed fields:

  | Field | Value |
  |---|---|
  | Received at | `2026-11-23T11:59:50.930Z` |
  | Run ID | `run-a176e1d0` |
  | Sequence | `1` |
  | Action | `hit` |
  | Acceptance | `accepted` |
  | Before | `{"ammunition":2,"score":0,"shots":0,"status":"active"}` |
  | After | `{"ammunition":1,"score":1,"shots":1,"status":"active"}` |

- The page started at `2, 0, 0, active` and changed after Hit to `1, 1, 1, active`. The recorded before/after objects matched the browser state exactly.
- With `collector: "down"`, Hit still changed the page to `ammunition: 1`, `score: 1`, `shots: 1`, `status: "active"`.
- The recording message became `Local recording unavailable`; the accepted shot was not undone.
- Restart and sequence reset passed the event check. The delayed-failure regression also passed.
- Raw observations are retained in [evidence-observations.json](./evidence-observations.json).
- Request/event suite: `9 passed (13.4s)` in [api-events-check.log](./api-events-check.log).

## 9. Release (acceptance 7)

- Full quality gate:

  ```text
  npm test
  tests 23
  pass 10
  fail 0
  skipped 13
  Browser: 10 passed (11.4s), 1 skipped
  ```

- The range route skips the rejected-button browser check because no rejectable enabled button exists on that route.
- Full output: [npm-test.log](./npm-test.log).
- Local release name: `playable-01`.
- I ran the supplied release tool with the installed Python executable:
  `C:\Users\6374qe\AppData\Local\Programs\Python\Python314\python.exe`.
- Pack output:

  ```text
  Packed release playable-01 (range): 47 files -> C:\Users\6374qe\Downloads\SWE Training\SWE Training\releases\playable-01
  ```

- The pack command also ran and passed `npm run check:rules`.
- Verify output before and after running the release:

  ```text
  Release playable-01 verified: 47 files match release.json (SHA-256)
  ```

- Manifest retained at [release.json](../releases/playable-01/release.json).
- Command outputs: [release-pack.log](./release-pack.log), [release-verify.log](./release-verify.log), [release-verify-after.log](./release-verify-after.log).
- I started the packed `serve.py` and confirmed `/healthz` returned `Healthy`.
- Against the running release, `P2_URL=http://127.0.0.1:4182 npm run check:browser` returned `10 passed (21.5s), 1 skipped`.
- Output: [release-browser.log](./release-browser.log).
- The `/api/ranges/reference` response header was `X-Lab-Release: playable-01`.
- Output: [release-header.log](./release-header.log).
- Source: editable `src/` files and tests in this project.
- Artifact: packed [playable-01 folder](../releases/playable-01/), including compiled browser code, supplied host and fixtures.
- Process: the running packed `serve.py`, which launched the release's own Node host.
- Scope: **local release only**, not a container, Kubernetes or BP deployment.

## 10. Individual responses

### My explanation

My game is **Dragon's Last Stand** using the `range` route. The player starts with two enchanted arrows, score zero and zero shots. The objective is to use the two arrows to drive off the dragon.

When I press Start, `start()` uses the verified configuration to create the initial state. It also creates a new run ID, resets the event sequence and paints the state on the page.

When I press Hit or Miss, the button handler sends the corresponding action to `dispatch()`. `dispatch()` saves the current state as the before-state and calls `evaluate(config, before, action)`.

`evaluate()` applies the deterministic rules:

- A Hit consumes one arrow, increases score by one and increases shots by one.
- A Miss consumes one arrow and increases shots by one, but does not increase score.
- When ammunition reaches zero, the state becomes `complete`.
- An unsupported event while active is rejected as `INVALID_EVENT`.
- An event after the game has completed is rejected as `GAME_COMPLETE`.

`evaluate()` returns a new state without mutating the supplied state. `dispatch()` keeps `result.state` and `paint()` renders that same object. This means the browser UI does not independently calculate the game result.

After the action has been evaluated, `recordEvent()` records the run ID, sequence number, action, acceptance and before/after states. I deliberately keep this outside the game rules because recording is a side effect. If the collector fails, the accepted Hit or Miss must still remain valid.

### My independently made change

The change I made was to complete and strengthen the event-recording boundary in `dispatch()`.

Originally, an action could be evaluated and displayed without producing a local event. I reproduced this by pressing Hit and observing that the game state changed while the Local recording box remained `No event recorded yet`.

I changed `dispatch()` so that it retains the before-state, evaluates the action, renders the returned state and then sends the event record containing:

- `runId`
- `sequence`
- `action`
- `accepted`
- `before`
- `after`

I also made sure that Start/Restart resets the sequence and that a delayed response from an older recording attempt cannot overwrite the recording status of a newer action or a new run.

This gave me a clear separation between deterministic game behaviour and asynchronous recording behaviour.

### Changed-input demonstration

I used the following active state:

- `ammunition: 1`
- `score: 0`
- `shots: 1`
- `status: "active"`

Action:

`miss`

Before running it, I predicted that the final arrow would be consumed, the score would remain zero, shots would become two and the game would complete.

Expected:

`{"ammunition":0,"score":0,"shots":2,"status":"complete"}`

with `accepted: true` and no rejection reason.

Actual:

`{"ammunition":0,"score":0,"shots":2,"status":"complete"}`

The action was accepted with no rejection reason, and the input state remained unchanged.

### Public-start trace

1. Start calls `start()`.
2. `start()` uses the verified configuration to call `initialState(config)`.
3. It generates a new run ID and resets sequence to zero.
4. `paint()` displays the starting state.
5. Pressing Hit creates `{ type: "hit" }`.
6. The button handler passes the action to `dispatch()`.
7. `dispatch()` retains the current state as `before`.
8. It calls `evaluate(config, before, action)`.
9. `evaluate()` returns an accepted result with the new state.
10. `dispatch()` stores `result.state`.
11. `paint()` displays that returned state.
12. `recordEvent()` records the run ID, sequence, action, acceptance and before/after states.
13. The recording response updates only the recording-status message and cannot change the game state.

The important thing I learned from tracing this is that `evaluate()` owns the game decision, while the browser and recording code are adapters around that deterministic logic.

## 11. Assistance and status

### Status per outcome

- **1. Typed models: demonstrated independently.** I can explain the `GameState`, `RangeStatus`, `GameAction` and rejection types and show how the TypeScript compiler rejects invalid values.
- **2. Core logic: demonstrated independently.** I can explain the range rules, changed-input test, rejection behaviour and input immutability.
- **3. Browser lifecycle: demonstrated independently.** I can run start, Hit/Miss, completion and restart and relate the displayed values to the returned rules state.
- **4. API behaviour: demonstrated independently.** I can show loading, success, HTTP failure, malformed JSON, unexpected definition and failed-reload preservation.
- **5. Debugging: demonstrated independently.** I can reproduce the missing-recording behaviour, identify the `dispatch()` boundary and show the same regression passing after the correction.
- **6. Event: demonstrated independently.** I can show the event row, explain sequence/run ID behaviour and demonstrate that collector failure cannot undo an accepted shot.
- **7. Release: demonstrated independently.** I can run the quality gate, pack `playable-01`, verify its SHA-256 manifest and run the packed release locally.

### Weakest outcome

My weakest outcome is **event recording and asynchronous behaviour**.

I understand the normal recording flow well, but the most challenging part was understanding what happens when asynchronous responses arrive late. For example, a recording request from an earlier action could finish after the player has already restarted the game.

If the application updated the recording message without checking which action/run the response belongs to, an old failure could incorrectly appear on the new game. This is why the stale-response protection is important.

### Next in-class revisit

My next revisit will focus on tracing one Hit through the complete application boundary:

1. Show the current `GameState`.
2. Trigger `{ type: "hit" }`.
3. Follow the call into `dispatch()`.
4. Identify the retained before-state.
5. Follow `evaluate()` and explain why it is deterministic.
6. Show the returned after-state.
7. Show how `paint()` renders that state.
8. Follow the event passed to `recordEvent()`.
9. Simulate/observe unavailable recording and explain why the shot remains accepted.
10. Restart and explain why an older asynchronous response must not update the new run.

This is the area I want to revisit because it combines deterministic TypeScript logic, browser state and asynchronous APIs in one flow.

<!-- In-class demo: not done yet. Uncomment and update after the real demo.
### In-class demo

I demonstrated **Dragon's Last Stand** through the public browser interface.

Demo steps:

1. Loaded the application and showed `Game data verified: Reference target range`.
2. Pressed Start and showed the initial state: `ammunition 2, score 0, shots 0, status active`.
3. Pressed Hit and showed `ammunition 1, score 1, shots 1, status active`.
4. Pressed Miss and showed `ammunition 0, score 1, shots 2, status complete`.
5. Showed that Hit and Miss were disabled after completion.
6. Pressed Restart and showed the fresh state `2, 0, 0, active` and a new run ID.
7. Performed another Hit and showed the corresponding event record with matching before/after state.
8. Explained that the event sequence resets for a fresh run.
9. Demonstrated the collector-unavailable scenario and showed that the page reports `Local recording unavailable` without undoing the accepted shot.
10. Showed the passing automated test results and the locally packed `playable-01` release.

The demo confirmed that the browser behaviour matched the deterministic rules and that event recording remained separate from the game state.

-->
### Personal reflection

The strongest part of my implementation is the deterministic range logic. The inputs and outputs are small and explicit, and the fixtures make it straightforward to show whether a rule is correct.

The TypeScript model was also useful because invalid values such as boolean ammunition or an unsupported `"paused"` status were caught during the build rather than becoming runtime problems.

The part I found most challenging was connecting deterministic rules to asynchronous browser behaviour. Event recording helped me understand why side effects should be kept outside core business logic. A successfully evaluated Hit should remain a Hit even if telemetry is unavailable.

I also learned why regression tests are useful when debugging. Instead of only fixing the observed UI issue, I kept a test that reproduced the failure so the same recording problem can be detected if it is introduced again.

My next focus is becoming more confident tracing asynchronous flows and identifying race conditions such as stale responses.

### Environment notes

- Browser setup initially failed because Playwright 1.61.0 required browser build 1228 while another browser build was already present.
- I ran `npx playwright install chromium` and reran the check successfully.
- This was an environment/setup issue rather than a game-code failure.
- The course pins Node 22.23.2 while this environment used Node 26.11.1 / npm 11.20.0. No runtime or test problems were observed in the exercise.

### Teardown and retained evidence

- Source and tests were retained.
- Before/after debugging logs were retained.
- Full quality-gate output was retained.
- Request/event output and event-row observations were retained.
- Release logs were retained.
- The named release and its `release.json` remain in `../releases/playable-01/`.
- The event row was saved before stopping the collector; live in-memory rows disappear when the collector shuts down.
- Temporary verification hosts and the packed release process were stopped after testing.
- No lab server was intentionally left running.
- Study notes: [PROJECT-NOTES.md](./PROJECT-NOTES.md).
