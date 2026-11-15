# ATE iOS 0.8.1 (22) — Save toolbar accessibility

Completed 14 November 2026 (America/Toronto). Apple processing **VALID**; internal testing **IN_BETA_TESTING**. Available to the existing internal tester group.

## Source and scope

- Tested/released source: `bb0d4cbf8c23153393b06c2b24ca5281875619bc`, branch `ios-tabs`.
- Successful release: https://github.com/willyros01/clear-page/actions/runs/43651324829
- Apple build ID: `2b31ba5a-c8ad-4a90-ba7e-de081a878e48`.
- Narrow screens give Menu, Close and Save a separate full-width row. Enlarged text/icon controls reflow; long save/recovery messages wrap without widening the page.
- CSS safe-area padding owns the full-screen WKWebView insets (`ios.contentInset: never`), keeping the toolbar below the status bar and clear of landscape cutouts.
- Preserve the independent document font and text/icon preferences, plus 0.8.0 Basic/Advanced tools, projects, Shell checking, exact filenames, tabs and recovery.
- No other platform distribution was rebuilt or published.

## Verified gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Node regression | 53 passed, 0 failed | Job 132620216081 |
| Chromium and WebKit | Passed existing editor/parser behavior and 60 toolbar combinations | Five widths (320/375/390/430/768px), three control sizes (100/200/300%), text/icons |
| iPhone WKWebView | 270 assertions passed | Job 132620580559 |
| iPad WKWebView | 270 assertions passed | Job 132620580565 |
| Production native functional tests | All three cases passed on each device | Modes/projects; tabs, native picker/share cancellation and recovery; toolbar/Save/keyboard/rotation |
| Largest OS accessibility text | Focused toolbar/Save test passed on both devices | Simulator content size accessibility-extra-extra-extra-large; separate xcresult bundle |
| Archive/export/upload | Passed | Job 132626503196: identity/version/assets, icon, privacy manifest and signature |
| Apple processing / tester group | VALID / IN_BETA_TESTING | Verified at 18:32 Toronto, 14 November 2026 |

Every regression and simulator gate passed before the TestFlight job started. Native UI tests use the clean production web assets, not the verification-driver bundle. Control/icon amplification supplements actual OS text-size testing.

Artifacts: browser 14136142355; iPhone 14136692264; iPad 14136444833; release 14137296659. Both functional/accessibility xcresult bundles, screenshots and logs are retained by the successful run.

## Test harness corrections

Earlier attempts exposed a repeated XCTest keyboard animation-idle wait, partly clipped targets incorrectly reported as hittable, asynchronous inactive-tab accessibility updates, and large-text native share sheets covering an outside-tap point. The harness now uses independent application sessions, fully visible target checks, explicit button-center taps, awaited recovery/dialog/sheet state, device-appropriate native sheet cancellation, orientation settling, live logs and bounded test execution. Evidence names include the attempt number. The final successful run passed all gates at the exact source above.

One earlier simulation attempt hit the existing eight-second parser startup watchdog. The final fresh iPhone/iPad suites passed every parser assertion without changing the checker implementation or watchdog. An unavailable/timed-out check must not be treated as valid code.

## Physical acceptance and limits

Physical iPhone/iPad acceptance remains the owner's next step. Keep preferred text/display settings, confirm Save stays fully visible and below the status bar, test text and icon buttons, edit/save a copy to Files and reopen it, cancel another save and confirm the draft remains, and repeat in landscape.

iOS saving continues to use the native Share/Save sheet and creates a copy. Simulator cancellation and mocked byte/name tests do not certify a successful write to every physical Files provider; confirm the exported copy in Files. Recovery is device-local, and undo history starts afresh after restart.

## Pending project UX requests

Not included in this toolbar release:

- Clear destination subdirectory for adding files, preferably a **+ beside each subdirectory**.
- Explicit **Close project**, protecting unsaved work and retaining stored files.
- A cohesive Projects page with a clear active-project heading, grouped actions, folder tree, consistent spacing and accessible touch targets.

Tracked in [TODO.md](TODO.md) and https://github.com/willyros01/clear-page/issues/3. The separate `ate-native-diagnostics` branch retains a read-only workflow for inspecting captured native failure evidence; it does not change the release app.
