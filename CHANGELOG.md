# Changelog

## 0.8.6 (27) — Vim mode in the bottom line
- With Vim editing on, the mode (NORMAL, INSERT…) shows in the slim bottom line instead of its own strip; on touch devices with the keyboard up it shows as a small tag in the top row. The Vim strip appears only for a command (:w, /search) or a Vim message.
- Menu heading stays "Editor menu" (VoiceOver and native tests) with the version shown beside it — already in iPhone/iPad 0.8.5, now on every platform.

## 0.8.5 (26) — more room to edit; Clang only where it can run
- Editing screen: one top row (Menu, tabs, Exit, Save); the version moves into the Menu title; the "Open files" heading stays for screen readers only. Long tab names keep their start and end (full name on long press/hover).
- Bottom line is slim; the full "Opened …" and other messages move into it and wrap rather than being cut. On touch devices the line hides while the on-screen keyboard is up.
- Projects uses the Menu's sizes (12pt controls, 14pt headings) with the full folder tree unchanged.
- Mac App Store (sandboxed) build: the Clang choice is hidden because the sandbox blocks starting Clang (xcrun refuses to run in an App Sandbox); the built-in C check remains. Cuberoot Mac and Windows keep Clang.

## 0.8.4 (25) — window fits the screen; one shared code base
- Mac and Windows: when the screen (above the taskbar or Dock) is smaller than the normal 1200 x 850 window, ATE opens the window at the screen's size and centres it, so the Syntax line and Save button are never off-screen. Larger screens keep the normal size. Native tests now require the whole window inside the screen and the Syntax line and Save button inside the window.
- The tested Android 0.8.3 fixes (older WebView support, Android tab scroll restore, single-open syntax dialogs, no re-save while exiting) are merged into the shared code, so web, Mac, Windows, Android, iPhone and iPad build from the same source.
- Android verification: durable restart marker, background-then-stop process kill, scroll-restore settle wait, guarded Save picker retry, failure screen and log printed into the run log.

## 0.8.1 (22) — iPhone toolbar accessibility
- Allow the header to reflow; narrow screens give Menu, Close and Save their own full-width row with three touch targets. Preserve chosen document text size and icon/text preference.
- Wrap save/recovery messages and constrain page widths so enlarged controls cannot push Save off-screen.
- Use CSS safe-area padding with native automatic content insets disabled, keeping the toolbar below the status bar and clear of landscape cutouts.
- Add 100–300% control/icon layout regressions across phone/tablet widths, native WKWebView checks, and actual iPhone/iPad toolbar/Save tests at the largest OS accessibility text setting. Release verified: 53 Node tests, Chromium/WebKit, both native simulator suites and largest-text checks passed before upload. Apple returned VALID / IN_BETA_TESTING; see RELEASE-0.8.1.md.

## 0.6.0 (19) — coordinated release
- Preserve explicit and extensionless filenames; remove automatic .txt appending. Android native Save avoids MIME-derived suffix suggestions. The unsaved rename report was not reproduced; no speculative root cause is claimed.
- Add bundled offline Python 3.13 syntax parsing with Ruff Wasm, SQLite SQL parsing, and selected Markdown lint warnings. No Python interpreter, database, compiler download or source execution is required.
- Retain existing offline JavaScript, TypeScript, JSON, HTML, CSS, YAML and Basic C checks; keep optional desktop Clang.
- Synchronize all platform versions/builds using release.json. iOS/universal Mac TestFlight and desktop website packages passed their gates; Android passed its dedicated compatibility/file-manager gates. Preserve 12pt controls and independent editor sizing.
- Android uses two persistent isolated worker engines with serialized newest requests. Initial C/Python Wasm loading has a separate 30-second startup allowance; warm checks retain the eight-second watchdog. CI-only timing probes are excluded from production.

## Automatic language detection (included in 0.6.0)
- Detect supported languages from filename first, then a bounded local content scan for C, JavaScript, TypeScript, JSON, HTML, CSS, YAML, Python, SQL and Markdown; ambiguous content remains plain text.
- Recognize source filenames ending in .txt without renaming them; re-detect restored automatic drafts instead of retaining a stale plain-text mode. Explicit manual selection survives recovery, filename edits and Save As.
- Detection never writes or renames a source file. The earlier unsolicited .txt report was not reproduced; the automatic append rule is removed as a filename-preservation change.

## 0.5.3 — desktop offline C parser by default
- Mac and Windows now default to the bundled basic offline C parser, with no compiler required.
- Added C settings → C checking → Advanced: installed Clang for optional header/type/macro checks. The explicit choice is remembered; compiler setup/download appears only in Advanced mode.
- Added desktop worker/Wasm CSP allowances, mode-routing/persistence tests and native default/basic/advanced verification. Preserve 12pt controls, headings max 14pt and independent editor font sizing.
- Preparing universal Mac TestFlight/website and Windows website releases. iOS/Android remain 0.5.2 (17).

## Compiler research — no application release
- Measured official Zig 0.17.1 archives and tested native Windows, Intel Mac and Apple silicon C checking. Embedded Clang 22.1.8 passed 44 direct-frontend fixtures and 21 system-Clang comparisons.
- Recorded the normal-driver syntax-only failure/timeout and the tested direct-frontend alternative, footprint/cache measurements and integration limits in assessment/RESULTS.md. ATE 0.5.2 binaries and existing compiler choices are unchanged.

## 0.5.2 — control sizing and Android file manager
- Added a read-only Apple availability audit: both 0.5.2 (17) builds were confirmed IN_BETA_TESTING in run 43211972237 after the owner reported missing updates. Device visibility/notification delivery remains unverified.
- Menus, configuration, search and syntax messages use 12pt text, headings at most 14pt. Document text keeps its independent 36px default and 10–54pt adjustment.
- Android/Fire Open and Save use native document pickers; cancellation preserves the draft, and Save confirms the actual UTF-8 write.
- Android 11 emulator verified the shared editor, save/cancel/reopen and exact saved bytes. Production excludes the verification driver and uses the permanent signer.
- Rebuilt iPad/universal Mac TestFlight 0.5.2 (17), Windows installer, notarized universal Mac installer and signed Android APK. Public website downloads match release hashes.
- Older WebView workers receive Object.hasOwn/String.replaceAll fallbacks; issue-list clearing avoids unsupported replaceChildren.
- Retained syntax checks, indentation, Vim and optional verified Windows Clang setup. Physical acceptance remains separate; see RELEASE-0.5.2.md.

## 0.5.1 — Windows optional C compiler setup
- Added an explicit optional LLVM-MinGW download/install with pinned SHA-256, cancellation/progress, standard-header verification and persistent ATE-only detection.
- No administrator access, PATH changes, paid service or automatic download on launch/open. The document stays in the editor throughout setup.
- Added Windows-only website release gates for download failure, checksum mismatch, cancellation, unsafe archives, official toolchain install, native diagnostics and exact installer installation/launch. Release evidence pending.

## 0.5.0 — Mac TestFlight
- Added a Mac-only TestFlight workflow using the current shared syntax-checking editor.
- Requires browser, compiler and native Mac webview checks before building a universal Intel/Apple silicon release.
- Universal Mac 0.5.0 (16) uploaded; Apple processing VALID and assignment to the existing internal tester group verified. Build ID: `59ad98c2-da97-4545-a850-07b24d74c2d4`.
- [Release run 43147595044](https://github.com/willyros01/clear-page/actions/runs/43147595044) passed 27 Node tests, Chromium/WebKit checks, five Clang/project tests and native Mac editing/syntax checks. Both arm64 and x86_64 binary architectures verified. Physical Mac acceptance remains pending.

## 0.3.2 — Another Text Editor (ATE)
- Renamed the product to Another Text Editor (ATE), retaining its existing app identity and recovery data.
- Replaced the blank generated icon with the approved minimalist faceless writing figure and upright paper.
- Removed Editor closed. Close clears the document, undo history, dialogs and keyboard focus without an extra page; iOS uses the Home gesture to leave the app.
- Added close/discard/cancel and next-draft recovery regression coverage.
- Version 0.3.2 (3) signed/uploaded, Apple processing VALID, and internal tester assignment verified. Simulator installation/launch passed; physical iPad acceptance pending.

## Internal TestFlight access
- Enabled the verified Apple account holder in Clear Page Internal and assigned 0.3.1 (1).
- Apple reports IN_BETA_TESTING with automatic notifications enabled. User invitation acceptance and device testing remain pending.

## First TestFlight pipeline (ios branch)
- Added reproducible release archive, app icon generation, root privacy-manifest packaging and signature checks.
- Added automatic Apple distribution signing/upload and processing verification.
- Clear Page 0.3.1 (1) signed and uploaded successfully; Apple processing returned VALID. Physical-device acceptance and tester assignment remain pending.

## Apple access preflight (ios branch)
- Added read-only validation of the Apple P8 key and access to the Clear Page app record, without logging credentials or tokens.
- Configured repository Apple signing identifiers; user saved the private key directly in GitHub.
- TestFlight distribution remains pending.

## iOS first build (ios branch)
- Added Capacitor iPhone/iPad shell generation and macOS simulator build/launch workflow.
- Added native save/share adapter and safe-area spacing.
- Signed distribution and physical-device acceptance remain pending.

## 0.3.1
- Set explicit theme-aware text, WebKit text fill, caret and background colors for Vim command/search inputs.
- Made command input width and minimum height explicit for readability.
- Build and existing automated checks passed. Browser visual verification unavailable due to preview access restriction; physical iPad confirmation pending.

## 0.3.0
- Added touch-sized search/replace controls, Go to line, Select all and system clipboard Copy with manual fallback.
- Added optional Vim key bindings, Ex command line, save and exit integration.
- Added bundled large-text online Help with topic links and command tables.
- Preserved language, appearance and editing mode when replacing documents.
- Browser-verified replacement, clipboard contents, Vim commands, Help and navigation.

## 0.2.2
- Added switchable icon/text controls with accessible labels.
- Changed editor sizing to 10–54pt with direct entry and one-point adjustments; retained the 36px-equivalent default.
- Persisted appearance preferences independently of drafts and migrated older pixel sizes.
- Verified both modes, minimum size, adjustment and reload persistence in desktop Chrome.

## 0.2.1
- Compacted the toolbar to one row and moved secondary controls into a readable menu.
- Added Exit with save, discard-draft, and cancel choices.
- Verified exit cancellation, draft discard across reload, save-and-exit download, and restart in desktop Chrome.

## 0.2.0
- Added bundled CodeMirror with JavaScript, HTML, CSS, Python and plain-text modes.
- Added syntax highlighting, four-space automatic indentation, line numbers, bracket matching, and touch-friendly indent/unindent buttons.
- Retained large adjustable text, light/dark appearance, full screen, file import/download, and existing browser drafts.
- Added reproducible build and automated indentation checks.
- Desktop browser acceptance passed; physical iPad acceptance remains pending.

## 0.1.0 — 2026-11-09
- Preserved the original full-screen text editor in GitHub.
- Added development instructions and phased platform roadmap.
- CodeMirror and native platform packaging are planned for subsequent steps.

## 0.4.0 — desktop release preparation
- Added Tauri desktop shell for Windows x64 and universal Intel/Apple silicon Mac.
- Native atomic Save with cancellation/error protection; window close/Quit share Exit choices.
- Shared editor tests cover desktop Save/Exit failure and success.
- Coordinated iPad TestFlight, desktop installers and Mac managed-signing/export workflow.
- Public release and native acceptance are pending the recorded workflow results.

## 0.4.1 — Desktop editor repair
- Reuse Tauri's per-document style nonce for CodeMirror runtime styles. This preserves the desktop security policy and restores editor layout, whitespace, font sizing, highlighting and Vim panel styling.
- Require Chromium/WebKit editing tests under the desktop nonce policy before desktop builds.
- Add feature-gated checks in actual Mac and Windows webviews for layout, syntax colors, indentation and Vim; distribution builds exclude the verification bridge.
- User reported Windows download rejection. The live 0.4.0 NSIS installer is a valid PE executable and matches its published SHA-256; the exact device error remains unconfirmed.
- Run 43087543526 passed Chromium/WebKit editing and actual Mac/Windows webview checks; both installers built and launched. Run 43087885350 also downloaded, recognized, installed and launched the exact public Windows installer. Physical-device acceptance and the user-specific Windows rejection remain open.

- Final delivery: Mac 0.4.1 (10) processed VALID and assigned to the existing internal TestFlight group. Windows 0.4.1 is live on Cuberoot; its downloaded bytes match SHA-256 `1aa3cb360916c12d00700fa74faf0ade5474541cf5e4ae70e945a04f00621159`. Browser-download testing reproduced the Windows “Unknown Publisher” confirmation for the unsigned installer; Windows recognizes its type as Application. This may explain the user's report, but the exact user-device message is still needed if different.

## Windows direct-distribution signing preparation
Added a manual-only Azure OIDC signing workflow, timestamp/publisher verification and installed executable checks. This is account-blocked preparation, not a signed release. Public download remains unsigned pending verified identity and a successful signed build.

## Device feedback and Mac notarization follow-up
The owner confirmed Windows 0.4.1 downloaded successfully after finding Keep, and indentation, syntax highlighting and Vim behave like iPad. Paid Windows signing was declined; no Azure signing account was created. Mac website signing succeeded, but notarization submission 06073ae2-3718-46f1-a9c2-9866b9606821 exceeded the initial 20-minute observation window. The recovery workflow checks that existing submission and only publishes after Apple's accepted archive hash, stapled ticket, Developer ID signature and Gatekeeper assessment all match.

Mac notarization completed: Apple returned Accepted. Recovery run 43103034568 passed exact archive-hash matching, staple validation, Developer ID and Gatekeeper checks for the universal 0.4.1 image. Cuberoot publication started.

## Syntax checking plan — 11 November 2026
- Added TODO.md with 12 tracked tasks covering language detection, diagnostics, JavaScript/JSON/HTML/CSS/YAML checks, C support through Clang/LLVM, compiler setup/licensing, additional languages and platform acceptance.
- Documentation only; syntax checking is not implemented and no application build or release is initiated.

## 0.5.0 — syntax checking (in verification)
- Added language detection and modes for C, JSON, YAML, TypeScript, SQL and Markdown.
- Added local parser checks for JavaScript/TypeScript/JSON/YAML/HTML/CSS, with manual and automatic checking, underlines and large clickable line/column diagnostics.
- Added desktop C checking through an installed Clang compiler, C standard selection, source/include folders and macros. Uses syntax-only stdin checks; never builds or runs the program.
- Added worker cancellation, size/time limits, bundled third-party notices, Help and verification tests. Python/SQL/Markdown checking and iPad C remain deferred.
- Native/browser CI and physical acceptance are tracked in TODO.md; no 0.5.0 release claimed yet.

0.5.0 verification checkpoint: 23 Node tests, Chromium/WebKit, five Clang tests on each native OS, native Mac/Windows UI and a Mac App Sandbox probe pass in run 43134841430. No 0.5.0 publication or physical acceptance is claimed. See TODO.md.

## Optional C compiler setup plan
- Recorded the owner-approved missing-compiler download/setup flow in TODO.md (SYN-13): official Apple setup on Mac and a verified LLVM-MinGW download on Windows, with Later, cancellation and re-detection.
- Planning only; no compiler download/installation or application release performed.

## 0.5.0 — iPad-first C syntax checking
- Added bundled Tree-sitter C/Wasm structural checks for iPad/web, with explicit header/macro/type/standard limitations and no compiler installer.
- Added iPad native webview checks for all seven languages, large text, correction/navigation, indentation and Vim; archive assets must match tested assets and exclude the test bridge.
- iPad-only branch skips desktop publication; simulator and TestFlight results are pending.

## iPad TestFlight 0.5.0 (15) complete
27 Node tests, Chromium/WebKit and 101 native iPad webview checks passed. The production archive verified its bundled C Wasm/worker assets and excluded the simulator test bridge. Apple processing is VALID and the build is assigned to the existing internal tester group. Packaging run 43141713621 reused the exact app source verified in native run 43139879836 after a packaging-script-only fix. Physical iPad acceptance remains pending; desktop website downloads remain 0.4.1. See TODO.md for evidence and remaining gates.


## 0.7.0 (20) — iOS tabs, TestFlight released 14 November 2026

- iPhone/iPad New and Open retain other files in tabs, with independent undo history, cursor/selection, scroll and language choices.
- Unsaved changes are marked with a dot. Close affects one tab and offers Save/Discard/Cancel for changes.
- Recovery restores all tab text/filenames/selections and active tab after restart; undo history is session-only. Legacy single drafts migrate after a successful workspace write.
- A visible warning reports recovery storage failures. Maximum 12 tabs. iOS Save still exports a copy; sharing completion does not prove a file was stored in Files.
- Protect newer edits made while sharing from Save-and-close; no automatic filename extension is added.
- Browser regression plus iPhone/iPad native-webview and XCUITest gates precede TestFlight upload. Other platform releases are unchanged.

Automated release: run 43613292921 passed 44 Node tests, Chromium/WebKit, 199 WKWebView assertions on each simulator, and native XCUITest on both iPhone/iPad. Apple processing is VALID and the build is IN_BETA_TESTING in the existing internal group. Physical-device acceptance remains pending; see RELEASE-0.7.0.md.

## 0.8.0 (21) — iOS Basic/Advanced, projects and Shell (verification in progress)

- Added a remembered Basic/Advanced tools switch. New installations start in Basic; existing users retain Advanced. Text, filename, undo, language choices and project associations are preserved; coding presentation/checking stops in Basic.
- Added iOS projects with ordinary Files-accessible UTF-8 files, folders, a JSON `project.ateproj` manifest, file tree, copying existing files, project saves, non-destructive Save As, membership-only removal and ZIP transfer.
- Project saves detect stale disk revisions before replacement. ZIP/path/count/size validation rejects unsafe imports. Project export requires saved project tabs and includes saved members only.
- Fixed Unix scripts misidentified as Python: shell extensions, startup files and interpreter headers take priority over embedded Python. Added shell highlighting and bundled POSIX/Bash structural checks; other recognized dialects receive a clear not-checked result.
- Existing syntax checkers, tabs, draft recovery, Vim and approved control/document font sizes are retained.

Owner confirmed 0.7.0 (20) worked flawlessly on physical testing before authorizing this update.

- Native UI verification found that scrolling the Projects panel could move Back to editor above the iPhone screen. Project navigation now stays in a separate fixed header, with browser geometry and native direct-tap regressions.


## iOS 0.8.2 (23) — implementation completed

Owner resumed this build on 15 November 2026. Includes project destination/+ controls, guarded Close project, cohesive single-scroll Projects page and aligned root/nested bottom rows; iPhone visual-viewport/menu return repair; a labelled contrasting filename field, Open files label and filename/content separation; general syntax-checker help; and unrestricted iOS file selection followed by strict text-byte validation so SQL/provider UTIs are selectable. Regression coverage includes SQL open/edit/save, metadata isolation, viewport changes, project save/cancel/discard/stale saves and enlarged layouts. Native iPhone/iPad and largest-OS-text gates passed before TestFlight. Physical Files-provider acceptance remains for owner testing. Previous stopped/pending statuses are superseded by this authorized work; the verified result below records release.


## Verified iOS 0.8.2 (23) release — 15 November 2026

ATE **0.8.2 (23)** is released to the existing internal TestFlight group. [Run 43684792345](https://github.com/willyros01/clear-page/actions/runs/43684792345) passed at tested source `93645a4cf237e7e615efeb3a19d052c8b3410919`. All 54 Node tests, Chromium/WebKit production regression, 291 native WKWebView assertions per device, all six production XCUITest cases per device, and both separate largest-OS-accessibility-text cases per device passed before archive/sign/upload. Apple processing is **VALID**, build `5e53acda-97ff-4272-8f44-f3768f9dfc9d`; existing-group **IN_BETA_TESTING** was verified at 01:59 America/Toronto on 15 November 2026 (06:59 UTC). Physical iPhone/iPad and individual Files-provider acceptance remain pending.

Includes iPhone visible-viewport/menu return repair; labelled contrasting filename card and Open files area; SQL/provider-type selection with strict UTF-8 validation; general syntax-checker information; project folder/root + destinations, guarded Close project, cohesive single-scroll page and aligned bottom rows. Document font and user zoom are preserved. Other published platform distributions were not rebuilt. See [RELEASE-0.8.2.md](RELEASE-0.8.2.md).


## iOS 0.8.3 (24) — approved Projects redesign, TestFlight released

Owner approved the reviewed mockup on 15 November 2026. The tree is the primary view: folder names select, arrows expand/collapse, filenames open an editor tab. Clear Open project / Close project controls; Open project also offers Create new project, ZIP import/export and secondary membership management. The selected-folder action bar offers Add file (Create file / Choose files), New folder and Delete folder; destination remains explicit. No scattered + buttons, Your projects section, always-visible filename/path form or per-file Remove boxes in the main tree. Projects uses larger 20px controls, 22px tablet/20px phone file labels, 24–28px headings and a compact 20px phone header; document font remains independent.

Folder deletion previews all contents (including unlisted on-disk files), refuses project root or unsaved affected tabs, detects changed contents before confirmation, stages the directory by rename, commits membership removal and rolls back on write failure before cleaning the staged directory. Clean affected tabs close only after successful deletion; other tabs, sibling folders, outside originals and other projects remain. Failed cleanup leaves a recovery copy and reports it. Regression and full iPhone/iPad native suites, plus largest-text checks, must pass before TestFlight upload. No change to the editor’s existing Close/Exit behavior is included in this Projects build. Physical-device acceptance follows TestFlight availability.

### 0.8.3 release-gate follow-up

- Keep only one Projects modal open at a time so returning from Open project, Keep folder or Close project restores the native accessibility controls, selected folder and scroll position.
- Separate the syntax worker initialization budget (30 seconds) from its parsing watchdog (8 seconds after readiness). A timeout still fails native verification and never counts as a successful syntax check.
- Added deterministic worker startup/watchdog coverage and Projects modal-return assertions; 59 tests pass. Native iPhone/iPad full functional and largest-text gates subsequently passed before TestFlight release; see the verified result below.


## Verified iOS 0.8.3 (24) release — 15 November 2026

ATE **0.8.3 (24)** is released to the existing internal TestFlight group. [Run 43719685778](https://github.com/willyros01/clear-page/actions/runs/43719685778) passed at tested source `b4eee097274214c87afd133566de44435d354bb8`. All **59 Node tests**, Chromium/WebKit production regression, **286 native WKWebView assertions per device**, the focused production Projects case, **all six full functional XCUITest cases per device**, and **both largest-OS-accessibility-text cases per device** passed before archive/sign/upload. Apple processing is **VALID**, build `f496fa71-3eb5-4361-850c-ddd63904427c`; existing-group **IN_BETA_TESTING** was verified at **09:24 America/Toronto on 15 November 2026** (14:24 UTC). Physical iPhone/iPad and individual Files-provider acceptance remain pending. See [RELEASE-0.8.3.md](RELEASE-0.8.3.md).

The WebKit dialog-return blocker is resolved by showing one Projects modal at a time. Syntax-worker startup has a separate 30-second initialization budget while parsing retains its eight-second post-readiness watchdog. Native timeouts remain failures; no test gate was bypassed. Existing editor Close/Exit behavior and the independent 36px document default are preserved.


## ATE 0.8.3 (24) — web, Android and desktop release in progress

Owner accepted iPhone/iPad build 24 and authorized web, signed APK, universal Mac TestFlight, notarized universal Mac and Windows builds. Share tabs, Basic/Advanced tools, filename/syntax fixes and the approved Projects design across platforms using thin storage adapters: native Capacitor filesystem on mobile, scoped app-data filesystem commands on desktop and IndexedDB in browsers. Preserve whole-app Exit on Mac/Windows/Android, with all-tab Save/Cancel protection; tab × remains a separate close action. iOS TestFlight is unchanged.

Gates: Node/browser regression including real browser storage and ZIP transfer, native Mac/Windows parser/editor/project storage tests, universal architecture/signature checks, Windows optional compiler and actual installer launch, Android 11 tablet and Android 15 phone process-recovery/native Files tests plus large-text navigation. Only clean production assets may be signed. Website publication must verify artifact provenance and exact public bytes. No physical-device acceptance is claimed by CI.

Android 11 verification found a main-bundle startup dependency on Object.hasOwn. The app entry now loads the same Object.hasOwn/String.replaceAll compatibility shims as the worker. Browser storage/ZIP tests also run with those APIs removed before startup. Native verification emits progress, and the emulator runner fails promptly on uncaught startup/runtime errors with logs/screenshots instead of waiting silently for a report.


## Verified desktop/web 0.8.3 (24) publication — 15 November 2026

Mac TestFlight is VALID / IN_BETA_TESTING (Apple build `baa2893b-a90b-4785-9785-091735c21119`). Signed/notarized/stapled universal Mac and the exact tested Windows installer are live on Cuberoot with public hashes verified; the web app and all public assets passed live browser/hash checks. Native desktop source `f52d12ec97793e34c3b2471509b0d0094d6ae9b7` was preserved through artifact release 43734007478 rather than rebuilt. Android failures are handled by the independent `android-083.yml` workflow on `android`, with no further desktop cancellation/rebuild. The earlier requirement to hold all platform publication for Android was superseded by the owner's direction to publish the successful Mac/Windows builds. APK verification remains in progress; physical-device acceptance is not claimed. See [RELEASE-0.8.3-PLATFORMS.md](RELEASE-0.8.3-PLATFORMS.md).
