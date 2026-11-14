# ATE iOS 0.7.0 (20)

Date: 14 November 2026. Source branch: `ios-tabs`.

## Result

All automated release gates passed. Apple processed iOS 0.7.0 (20) as **VALID** and enabled **IN_BETA_TESTING** in the existing internal group on 14 November 2026 at 16:25 UTC.

Apple build ID: `ecae3ae1-3131-411d-90c5-c05caab20d7f`. Group: `a310eafe-4a60-4759-ba9e-a4db47551732`. This is an internal TestFlight release, not a public App Store release.

## User-visible changes

- New/Open add independent iPhone/iPad document tabs, up to twelve. A dot marks changes since open/last completed export. Closing a changed tab offers Save/Discard/Cancel and affects only that tab.
- Tabs preserve separate text, exact filenames, language/manual choices, undo history, selection and scroll during the session. Recovery restores the workspace and active document after process restart; undo history starts fresh.
- Existing single recovery drafts migrate after the workspace has been stored successfully. Storage failures show an explicit warning; unreadable recovery is retained instead of overwritten.
- Automatic language detection runs on recovery; explicit overrides remain selected. Filename detection does not rename files or add extensions.
- New edits made during asynchronous sharing are kept, and Save-and-close will not discard those newer edits.
- Editor defaults remain 27pt/36px with adjustable sizing; controls stay 12pt, headings at most 14pt, touch targets at least 44px. Existing offline parsers, indentation and Vim remain included.

## Provenance and evidence

Production/test source: `d23b3ff66fc3555983027a74cf75d01a8c307242`.

[Release workflow](https://github.com/willyros01/clear-page/actions/runs/43613292921)

| Gate | Result | Evidence |
|---|---|---|
| Node integration/regression | 44 tests passed | Job 132502805281 |
| Chromium/WebKit production-bundle regression | Both passed, including strict desktop CSP | Job 132502805281; artifact 14121535827 |
| iPhone native WKWebView | 199 assertions passed | Job 132503193870; artifact 14121413558 |
| iPad native WKWebView | 199 assertions passed | Job 132503193820; artifact 14121394197 |
| Native XCUITest | Both devices passed | Same native jobs, full xcresult bundles and UI logs |
| TestFlight archive/upload and Apple processing | Uploaded, VALID and IN_BETA_TESTING | Job 132508088014; artifact 14121618850 |

Native coverage includes all ten supported language checkers, valid/invalid diagnostics and clearing, language detection, control fonts, whitespace/indentation, Vim, independent tabs/undo/selection/scroll, discard/cancel, forced-process recovery, actual Files picker and Share-sheet cancellation, rotation and Home/background/resume. The clean production bundle was used for XCUITest; verification assets are excluded from distribution.

## Scope and remaining acceptance

This release enables tabs on iOS only. Mac/Windows/Android published versions remain 0.6.0 (19). Shared source uses one tab controller and platform activation; no duplicate native editor was added.

Simulators do not certify physical devices or every third-party Files provider. iOS Save continues to export a copy through Share/Save. Bridge tests validate payload/name, cancellation and success; actual Files destination success/reopening should be validated on the owner's devices. A completed share activity does not independently prove a file was stored in Files.

Physical iPhone/iPad acceptance and TestFlight device visibility remain unverified. Other proposed features are still planned. [Detailed test plan](IOS-TABS-TEST-PLAN.md).
