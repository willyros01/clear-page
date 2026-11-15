# ATE iOS 0.8.2 (23)

ATE **0.8.2 (23)** is released to the existing internal TestFlight group. [Run 43684792345](https://github.com/willyros01/clear-page/actions/runs/43684792345) passed at tested source `93645a4cf237e7e615efeb3a19d052c8b3410919`. All 54 Node tests, Chromium/WebKit production regression, 291 native WKWebView assertions per device, all six production XCUITest cases per device, and both separate largest-OS-accessibility-text cases per device passed before archive/sign/upload. Apple processing is **VALID**, build `5e53acda-97ff-4272-8f44-f3768f9dfc9d`; existing-group **IN_BETA_TESTING** was verified at 01:59 America/Toronto on 15 November 2026 (06:59 UTC). Physical iPhone/iPad and individual Files-provider acceptance remain pending.

## Changes

- iPhone/iPad shell and dialogs follow the visible viewport through keyboard resize/panning, menu return and export cancellation. Toolbar targets wrap into fewer columns when magnification narrows the screen. Document font, text and user zoom are preserved.
- File name has a persistent label, contrasting bordered field and explanation. Enter commits metadata without inserting text. Empty names show Untitled. Open files distinguishes filename tabs from document content.
- About syntax checking covers JavaScript/TypeScript, JSON/YAML, HTML/CSS, Python, Shell, SQLite SQL, Markdown and C, including limits.
- iOS Open/Add files permit SQL and extensionless provider types, then enforce strict UTF-8/text/size validation. Exact filenames are preserved. The native source menu offers Choose File/Choose Files.
- Projects groups the active project, saved projects, destinations and file actions coherently. + beside each folder/root opens a preselected destination composer. All file-box edges align, and a single scrolling body keeps the final row/Remove reachable.
- Close project offers Keep project open, Save and close project or Close without saving. Saved files and ordinary/other-project tabs remain. External/stale writes fail safely. Back to editor separately dismisses Projects.

## Verified gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Node regression | 54 passed, 0 failed | Job 132722949793 |
| Chromium / WebKit | Production editor, filename/SQL/project flows; 60 toolbar and 24 project-layout combinations; magnified viewport | Job 132722949793 |
| iPhone native WKWebView | 291 assertions passed | Job 132723348212 |
| iPad native WKWebView | 291 assertions passed | Job 132723348217 |
| Production XCUITest | All six cases passed on each device | Native typing/taps, Files/Share cancellation, project Close, undo/tabs/recovery, rotation/background |
| Largest OS accessibility text | Both focused cases passed on each device | Separate xcresult bundles; project layout and toolbar/Save |
| Archive/sign/upload | Passed identity, version, assets, privacy manifest and signature checks | Job 132730547690; uploaded 06:55 UTC |
| Apple processing / tester assignment | VALID / IN_BETA_TESTING, existing internal group | 5e53acda-97ff-4272-8f44-f3768f9dfc9d; verified 06:59 UTC |

## Physical acceptance

Update ATE in TestFlight on iPhone/iPad. Repeat Menu → File name → Done with the preferred text/display settings, cancel Export/Save, and verify no shift/clipping or document-text changes. The filename belongs to the labelled Open files tab. Open and edit .sql from each Files provider, save to Files and reopen the copy. Test folder + import, Close Cancel/Save/Discard, and the final project row in landscape. Simulator results do not certify every physical Files provider or completed Save to Files destination. Other platform distributions were not rebuilt.
