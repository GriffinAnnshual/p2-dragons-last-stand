# Griffin's Project 2 study notes

## Goal

Dragon's Last Stand is a small browser game written in TypeScript. The hero starts with two arrows. Hit uses an arrow and adds one point. Miss uses an arrow without adding a point. When there are no arrows left, the game finishes. Restart begins a new game.

The project proves seven things: typed data, tested rules, a complete browser lifecycle, API failure handling, a debugging regression, a recorded event and a verified local release.

## My project map

| Part | Purpose | File |
|---|---|---|
| Models | Describe the permitted data and actions | [models.ts](./src/models.ts) |
| Rules | Calculate the next state | [rules.ts](./src/rules.ts) |
| API adapter | Fetch and validate game data | [api.ts](./src/api.ts) |
| Application adapter | Connect buttons, rules, display and recording | [app.ts](./src/app.ts) |
| Learner tests | Check changed inputs and unchanged input states | [learner.test.mjs](./tests/learner.test.mjs) |
| Evidence | Record actual observations | [evidence.md](./evidence.md) |

## 1. Typed models

A type describes what a value is allowed to contain. `ammunition`, `score` and `shots` are numbers. `status` can be `"active"` or `"complete"`. An action is `"hit"` or `"miss"`.

`"paused"` is rejected by TypeScript because it is not a permitted status. This happens during the build, before the browser runs the game. The earlier compiler experiment and diagnostics are preserved in [evidence.md](./evidence.md).

`readonly` stops ordinary TypeScript code assigning new values to a field. It does not itself freeze an object at runtime. The tests also freeze their inputs to catch accidental changes while executing.

## 2. Core rules

State means the facts about the game at one moment. A normal run is:

| Moment | Arrows | Score | Shots | Status |
|---|---:|---:|---:|---|
| Start | 2 | 0 | 0 | active |
| Hit | 1 | 1 | 1 | active |
| Miss | 0 | 1 | 2 | complete |

`evaluate()` returns a result containing `accepted`, `reason` and `state`. An unknown event during an active game returns `INVALID_EVENT`. Any event after completion returns `GAME_COMPLETE`. Rejected actions leave the state unchanged.

The rules are deterministic: the same configuration, state and action produce the same answer. They do not read a clock, generate random numbers or send requests.

The new zero-score test starts at one arrow, zero points and one shot. A miss produces zero arrows, zero points, two shots and completion. It also checks that the original state is unchanged.

## 3. Browser lifecycle

The API supplies verified configuration before Start can create a game. Start creates fresh state and a new run ID. A run ID identifies one game attempt. Hit and Miss call `dispatch()`, which asks the rules for a result and displays the returned state. Finishing disables the shot buttons. Restart creates fresh state, a new run ID and sequence zero.

There is no rejectable enabled button on the range route. During play, both shot buttons are valid. After completion, both are disabled. The supplied rejected-button browser test therefore skips this route. The rules tests still verify rejection, so a disabled button is not the only protection.

## 4. API loading and failures

An API is a way for programs to request data from one another. This project uses the supplied local host. The browser requests `/api/ranges/reference`.

The adapter separates these boundaries:

1. Reaching the server.
2. Receiving a successful HTTP status.
3. Reading valid JSON, the text format used for the response.
4. Checking that the data matches the supported reference range.

| Observation from the run | Exact message |
|---|---|
| Waiting for the response | `Loading game data...` |
| Success | `Game data verified: Reference target range` |
| HTTP failure | `Game data request failed: HTTP 503` |
| Invalid JSON | `Game data is malformed: the response is not valid JSON` |
| Unsupported definition | `Unexpected game definition: this package supports only the fixed reference definition` |

Reload requests configuration; it is not Restart. A failed reload does not replace the verified configuration or the current state. The check kept `1, 1, 1, active` after HTTP 503 and then successfully finished with Miss.

## 5. Debugging

A regression test checks that a fixed problem does not return.

The actual problem was that Hit changed the game but did not record an event. The existing event-view test failed because the recording message stayed `No event recorded yet`. The responsible boundary was `dispatch()` in the application adapter.

`recordEvent()` records the before/after state and recording messages. The same test passed after the correction. The original failure is in [debug-before.log](./debug-before.log); the passing run is in [debug-after.log](./debug-after.log).

No artificial defect or facilitator diagnostic variant was used.

## 6. Recording an event

An event is a record of something that happened. This game records:

- `runId`: which game attempt.
- `sequence`: which action in that attempt, starting at one.
- `action`: Hit or Miss.
- `accepted`: whether the rules accepted it.
- `before` and `after`: the game state on each side of the action.

The display sequence is:

```text
Button -> dispatch -> evaluate -> paint -> recordEvent
```

The recording request happens separately from the game decision. Success shows `Recorded locally`; failure shows `Local recording unavailable`. Neither response undoes a shot.

A slow response for an earlier action must not replace the recording message for a newer action or restarted game. The application checks the event's run ID and sequence before updating that message. The added browser test verified a delayed failure after Restart.

The collector stores rows only in its process memory. Stopping it loses the live rows. The actual saved row and matching page states are retained in [evidence-observations.json](./evidence-observations.json).

## 7. Local release

| Term | Meaning here |
|---|---|
| Source | Editable TypeScript and tests |
| Artifact | Packed [playable-01](../releases/playable-01/) files |
| Process | The running packed Python launcher and its Node host |

Packing runs the rules gate and produces a named folder. Its [release.json](../releases/playable-01/release.json) lists each file's SHA-256 hash. A hash is a fingerprint used to detect changed contents. Verification checked all 47 files before and after running the release.

The running release returned `X-Lab-Release: playable-01` on its game-data response. Browser checks against that release passed. It was then stopped.

This is **local release only**. It is not a container, Kubernetes or BP deployment.

## Verified results

| Check | Actual result | Retained output |
|---|---|---|
| Rules in full quality gate | 10 passed, 0 failed, 13 skipped | [npm-test.log](./npm-test.log) |
| Browser in full quality gate | 10 passed, 1 skipped | [npm-test.log](./npm-test.log) |
| Request and event checks | 9 passed | [api-events-check.log](./api-events-check.log) |
| Browser against release | 10 passed, 1 skipped | [release-browser.log](./release-browser.log) |
| Inventory after running release | 47 files match | [release-verify-after.log](./release-verify-after.log) |

The counts exceed the original plan because the completion run added one rule regression and one browser regression.

## Run again on this Windows machine

From this project folder in PowerShell:

```powershell
npm test
npm start
```

Open [http://127.0.0.1:4182](http://127.0.0.1:4182). Stop that development server with Ctrl+C before running the packed release:

```powershell
& 'C:\Users\6374qe\AppData\Local\Programs\Python\Python314\python.exe' -I '..\releases\playable-01\serve.py'
```

To check the running release from a second PowerShell terminal in this project folder:

```powershell
$env:P2_URL = 'http://127.0.0.1:4182'
npm run check:browser
Remove-Item Env:P2_URL
& 'C:\Users\6374qe\AppData\Local\Programs\Python\Python314\python.exe' -I '.\tools\release.py' verify '..\releases\playable-01'
```

The environment variable tells Playwright to check the existing release instead of launching a development server. Remove it before using checks that should launch their own server.

The existing release is preserved. A future pack needs a new name rather than overwriting this artifact.

## Individual assessment boundary

These notes explain the implementation and verified results. They do not claim a learner-selected weakest outcome or a trainer-observed in-class demo. Those were not provided during the completion run.
