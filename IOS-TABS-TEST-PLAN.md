# ATE iOS tabs — test plan

Target: iPhone/iPad, 0.7.0 (20). Other platform distributions stay at 0.6.0 (19).

## Automated gates

1. Existing Node regression suite: parsers, worker cancellation, exact filenames, discard, desktop save/error/close, compiler settings and setup.
2. iOS application integration: migrate a legacy draft; independent tab text/undo/language/selection; dirty indicators, undo-to-clean, close cancellation/discard; extensionless export; share cancellation, success and edits during sharing; tab limit; recovery-write failure and restoration; malformed recovery preserved.
3. Chromium and WebKit production-bundle regression under desktop CSP: layout, 36px editor, syntax colors, indentation, Vim, search/substitution, diagnostics, language detection and recovery.
4. iPhone and iPad simulators: all ten offline languages (valid/invalid and diagnostic clearing), native WKWebView, menus/control fonts, indentation, Vim, appearance, tab states and forced-process-restart recovery of multiple documents.
5. XCUITest against clean production assets: actual native UI taps/typing, tab switching, close cancellation, actual Files picker cancellation and Share sheet cancellation, terminate/relaunch, orientation and background/resume. Full `.xcresult` and screenshot attachments retained.
6. TestFlight archive only after both simulator jobs and browser regression pass. Archive asserts production asset identity, expected version, signing/privacy resources and absence of the simulator-only verifier.

## Limits and owner validation

- Simulators cannot certify physical-device behavior or every third-party Files provider.
- iOS saving still uses its existing Share/Save sheet and creates a copy. A completed activity does not prove a copy was written to Files. Confirm the exported file in Files before relying on it; cancellation preserves the open tab.
- Save success, byte payload and filename cases are automated with a mocked native bridge; actual Files destination success and reopening the exported copy require physical-device validation. Actual native picker/sheet cancellation is covered by XCUITest.
- Undo/redo history is independent while the app runs. Recovery preserves text, filename, language/manual choice, selection, scroll and active tab; undo history starts fresh after restart.
- Twelve tabs maximum. Recovery is device-local and subject to storage quota; a visible warning requests an explicit file save if recovery cannot be stored. Clearing application data removes recovery.
- No code samples are executed by syntax checking.

Owner acceptance: open C/header/Python files, edit and switch tabs, save each to Files and reopen the copies, cancel a save, close/discard one tab, background/restart, verify text and filenames, repeat using hardware-keyboard Vim and touch editing.

## Recorded result — 14 November 2026

Run 43613292921 at `d23b3ff66fc3555983027a74cf75d01a8c307242` passed every gate: 44 Node tests, Chromium/WebKit, 199 native-webview assertions per simulator, actual native Files/Share cancellation, two-file typing/switching, close cancellation, process restart, rotation and background/resume. TestFlight 0.7.0 (20) is VALID / IN_BETA_TESTING in the existing internal group. Physical-device and Files-destination acceptance remain pending. See RELEASE-0.7.0.md.

## 0.8.1 (22) accessibility regression

- Browser tests: widths 320/375/390/430/768px; 100/200/300% controls with text and icon buttons; all toolbar targets fully visible, uncovered, non-overlapping and at least 44px; long/unbroken save messages wrap without page overflow.
- Native WKWebView: repeat amplified control/icon checks on both device types.
- Production XCUITest: full prior functional suite plus toolbar bounds/status-bar clearance, keyboard, actual Save sheet cancellation and orientation. Repeat the focused toolbar test with simulator OS content size accessibility-extra-extra-extra-large. Retain both result bundles and screenshots.
- Native contentInset is never; CSS safe-area padding owns the full-screen webview insets. Do not disable iPhone text enlargement or reduce the document font to hide layout errors.
- Release pending; verify on the owner’s physical iPhone at their chosen text/display settings after TestFlight availability.

## Verified 0.8.1 result — 14 November 2026 (Toronto)

ATE **0.8.1 (22)** completed in [run 43651324829](https://github.com/willyros01/clear-page/actions/runs/43651324829) at tested source `bb0d4cbf8c23153393b06c2b24ca5281875619bc`. All 53 Node tests, Chromium/WebKit regression, 270 native WKWebView assertions on each device, three production XCUITest cases per device, and the separate largest-OS-accessibility-text toolbar/Save test on both iPhone and iPad passed before signing/upload. Apple processing is **VALID**, build `2b31ba5a-c8ad-4a90-ba7e-de081a878e48`, and **IN_BETA_TESTING** membership in the existing internal tester group was verified at 18:32 America/Toronto on 14 November 2026. Physical-device acceptance remains pending. See [RELEASE-0.8.1.md](RELEASE-0.8.1.md).

Native UI tests use fully visible targets, explicit Menu tap centers, awaited dialog/native sheet dismissal, independent application sessions for project/tab/toolbar cases, orientation settling, live progress and bounded execution. The largest-text test uses the actual simulator OS accessibility-extra-extra-extra-large setting; control amplification in WKWebView/browser tests is additional coverage. Screenshots and both xcresult bundles are retained by the run.


## 0.8.2 (23) menu, filename, SQL and project regressions

- Node integration: filename Enter/Done changes metadata only; empty names fall back to Untitled; SQL open/edit/export preserves the exact extension and payload. iOS picker filtering permits provider-classified SQL and extensionless source; bytes are still validated for UTF-8, binary content and size.
- Viewport tests preserve document text, font and zoom through keyboard pan/resize and menu return. Production Chromium/WebKit cover phone portrait/landscape, narrow magnified viewport reflow, SQL input/cancelled save, 60 toolbar combinations and 24 enlarged project layouts.
- Project integration: root/nested + destinations captured before selection, cancellation/collisions, aligned file boxes and reachable bottom rows, Close Cancel/Save/Discard, stale-save failures, ordinary/other-project tab preservation and reopening after restart.
- Native WKWebView repeats filename/content isolation, focus/viewport containment, general syntax help and every checker, real filesystem project writes, destination capture, enlarged geometry, Close and recovery.
- Clean-production XCUITest runs six cases per device: filename/menu return; modes/projects; folder destinations, native Files cancellation and guarded Close; project row alignment; independent tabs, native Files/Share cancellation, forced restart, rotation/background; toolbar/Save visibility. The native harness follows Choose File/Choose Files before cancelling and dismisses Apple’s slide-to-type introduction when it blocks the keyboard accessory.
- Separate largest OS content size accessibility-extra-extra-extra-large runs project alignment/bottom-row and toolbar/Save tests on both devices. All target visibility, minimum touch size and alignment assertions remain mandatory.

### Verified result

ATE **0.8.2 (23)** is released to the existing internal TestFlight group. [Run 43684792345](https://github.com/willyros01/clear-page/actions/runs/43684792345) passed at tested source `93645a4cf237e7e615efeb3a19d052c8b3410919`. All 54 Node tests, Chromium/WebKit production regression, 291 native WKWebView assertions per device, all six production XCUITest cases per device, and both separate largest-OS-accessibility-text cases per device passed before archive/sign/upload. Apple processing is **VALID**, build `5e53acda-97ff-4272-8f44-f3768f9dfc9d`; existing-group **IN_BETA_TESTING** was verified at 01:59 America/Toronto on 15 November 2026 (06:59 UTC). Physical iPhone/iPad and individual Files-provider acceptance remain pending.

Actual successful Save to Files destinations, particular third-party provider SQL types and the owner’s physical iPhone display/text settings require owner acceptance. Native simulator tests verify real picker/share cancellation; simulator results do not certify every physical provider.


## iOS 0.8.3 (24) — approved Projects redesign, implementation in verification

Owner approved the reviewed mockup on 15 November 2026. The tree is the primary view: folder names select, arrows expand/collapse, filenames open an editor tab. Clear Open project / Close project controls; Open project also offers Create new project, ZIP import/export and secondary membership management. The selected-folder action bar offers Add file (Create file / Choose files), New folder and Delete folder; destination remains explicit. No scattered + buttons, Your projects section, always-visible filename/path form or per-file Remove boxes in the main tree. Projects uses the approved larger 20px controls, 22px file labels and 24–28px headings; document font remains independent.

Folder deletion previews all contents (including unlisted on-disk files), refuses project root or unsaved affected tabs, detects changed contents before confirmation, stages the directory by rename, commits membership removal and rolls back on write failure before cleaning the staged directory. Clean affected tabs close only after successful deletion; other tabs, sibling folders, outside originals and other projects remain. Failed cleanup leaves a recovery copy and reports it. Regression and full iPhone/iPad native suites, plus largest-text checks, must pass before TestFlight upload. No change to the editor’s existing Close/Exit behavior is included in this Projects build. Physical-device acceptance follows TestFlight availability.
