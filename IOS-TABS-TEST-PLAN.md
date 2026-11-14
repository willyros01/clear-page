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
