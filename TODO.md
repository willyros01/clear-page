# ATE syntax checking TODO

Last updated: 12 November 2026 (UTC).

## Next build (0.8.8) — approved by Willy, not built yet

Willy, 16 Nov 2026: "include on the todo list for next build. no building now." Build only when he says so; then every platform (Mac, Windows, Android, iPhone/iPad) together, tested on the simulators first.

| # | Item | Status |
| --- | --- | --- |
| 1 | Help: clear "Projects and ZIP files" topic, listed in the Help topics, with numbered steps to make a project ZIP and where it goes on each device. | Implemented on branch help-projects (commit 0b32f6e); 63 tests pass; walked through on a phone-sized screen (My program.zip made). |
| 2 | Rename Menu → "Export copy" to "Export this file", so it is not mistaken for the project ZIP (it saves only the open file). Update Help wording to match. | Pending |

Feature backlog: [ATE features to-do list](FEATURES-TODO.md), recorded 15 November 2026, with six planned features in the agreed priority order.

## Coordinated 0.6.0 (19) update — released; physical acceptance pending

Owner authorized the combined update after being unable to reproduce the unsaved .txt report. No cause for that report is claimed. All distributions will use release.json: version 0.6.0, build 19.

| Item | Implementation | Verification / release |
| --- | --- | --- |
| Exact filenames | Removed shared .txt append rule; defaults use Untitled. Android Save uses application/x-ate-document to avoid MIME-based suffix insertion. | Native Android file-manager Save/cancel/reopen and exact .c/extensionless names pass; shared Save/discard regressions pass. Physical acceptance pending. |
| Language detection | Filename first; bounded content fallback for all supported code languages; manual override retained; automatic drafts re-detected. | Automated regression tests pass; native checks included. |
| Offline Python | Bundled MIT Ruff 0.6.9 Wasm, Python 3.13 parser, no execution/import/type checking. | Missing colon, indentation, Unicode, malformed strings and valid modern Python tested; native worker gates pass. |
| Offline SQL | Bundled Apache-2.0 node-sql-parser 5.4.0 SQLite grammar. No database or execution. Other dialects not promised. | Valid multi-statements and malformed SQL tested; native worker gates pass. |
| Markdown | Bundled MIT Lezer parser; duplicate-heading, unclosed-fence and trailing-whitespace lint warnings. | Valid/invalid fixtures tested; native gates pass. |
| One release | iOS, universal Mac TestFlight/website, Windows and Android use the coordinated workflow. Existing JS/TS/JSON/HTML/CSS/YAML/Basic C retained. | 42 Node tests and shared build pass. TestFlight and all website distributions are published and verified; RELEASE-0.6.0.md records sources, hashes and runs. |

## Current progress

ATE **0.6.0 (19)** synchronizes the platform release numbers. iPhone/iPad and universal Mac are VALID/IN_BETA_TESTING; desktop website packages and Android native/signing gates pass. See [RELEASE-0.6.0.md](RELEASE-0.6.0.md) for exact sources, runs, signatures and final public-byte verification. Physical-device acceptance remains separate.

Menus, search, syntax messages and Clang/compiler configuration use 12pt controls (headings at most 14pt). Document text retains its independent 36px default and adjustment.

Statuses: Pending → In progress → Implemented → Verified. Assessed records a documented feasibility decision. Use Blocked when a dependency prevents work. Mark a task Verified only with evidence; automated checks and physical-device acceptance must be recorded separately. Update this table and the progress log with each change.

## Scope and decisions

- Add code checking based on document language, distinct from syntax highlighting and indentation already available in several modes.
- Initial target: JavaScript, JSON, HTML, CSS, YAML and C. Additional candidates: TypeScript, Python, SQL and Markdown.
- C desktop recommendation: Clang/LLVM; Apple Command Line Tools on Mac, LLVM-MinGW on Windows. Compiler integration and optional Windows setup are implemented and CI verified; Mac guided setup and physical acceptance remain pending.
- Keep ATE proprietary. Retain required third-party licenses/notices; do not change ATE's license.
- Prefer local/offline checking. Do not execute user programs as part of checking or upload document contents.
- Keep shared editor behavior with thin native adapters. Preserve 36px default text, adjustable sizing, themes and Vim behavior.
- The owner authorized implementation on 11 November 2026. Changes are verified before integration into the release branch; the current coordinated release is 0.6.0 (19).

## Tracked tasks

| ID | Work | Status | Completion evidence / next step |
| --- | --- | --- | --- |
| SYN-01 | Detect language from extension and provide a manual selector for new/ambiguous files. | Verified in automated environments | 0.6.0: filename-first detection plus bounded content fallback for all ten supported code languages; wrapped .txt source names recognized without renaming. Stale automatic recovery corrected; manual override retained. Shared build and 42 Node tests pass. |
| SYN-02 | Add readable error underlines, line/column messages, error list and jump-to-error. | Verified | Chromium/WebKit and native Mac/Windows diagnostics, underlines, jump, themes/Vim pass; narrow layout inspected. |
| SYN-03 | Add Check Syntax command and debounced checks while typing. | Verified | Worker and native queue cancellation tests pass; manual/automatic checks, limits and unavailable states verified. |
| SYN-04 | Implement JavaScript and JSON checking. | Verified | Valid/invalid JS/JSON fixtures and live diagnostics pass; JSX file modes and non-execution tested. |
| SYN-05 | Implement HTML and CSS checking. | Verified | HTML inline JS/JSON/CSS and malformed CSS fixtures pass; parser limitations documented. |
| SYN-06 | Implement YAML checking. | Verified | YAML malformed flows, duplicate keys and multi-document fixtures pass. |
| SYN-07 | Add C highlighting, indentation and C-standard selection. | Verified | C extension/standard controls and four-space indentation tested; native C diagnostics work. |
| SYN-08 | Integrate desktop Clang syntax-only checking on Mac and Windows. | Verified | Native Mac/Windows and Mac sandbox probe pass with installed Clang; distributed app acceptance remains under SYN-12. |
| SYN-09 | Support C headers, include paths, macros and project compiler settings. | Verified | Five native Rust tests pass on both OSes, including project/local/additional headers and macros. |
| SYN-10 | Decide compiler setup/distribution and document licenses. | Verified | Decision: user-installed tools; no compiler/SDK bundle. JS notices bundled and proprietary ATE licensing retained. |
| SYN-11 | TypeScript, Python, SQL, Markdown and bundled C checking. | Verified in automated environments | 0.6.0: TypeScript syntax, offline Python 3.13/Ruff, SQLite grammar and selected Markdown lint are implemented. Basic C remains on all platforms. Parser limits and native evidence are in RELEASE-0.6.0.md. |
| SYN-12 | Verify, document and release approved changes across platforms. | Automated release verified; physical acceptance pending | 0.6.0 (19) iPad/Mac TestFlight VALID/IN_BETA_TESTING; desktop public hashes verified; signed Android and all native gates pass. Live APK bytes/signature are verified. Final publication evidence is in RELEASE-0.6.0.md. |

| SYN-13 | Offer optional free compiler download/setup when C checking cannot find Clang. | Windows verified; Mac pending | Official LLVM-MinGW installation, cancellation, checksum rejection, standard headers, detection and installer/native editor passed in run 43168469203. Mac uses an installed Clang/Apple Command Line Tools. |

## 0.5.2 release tasks

| ID | Work | Status | Evidence |
| --- | --- | --- | --- |
| UI-01 | 12pt controls, headings max 14pt, preserve adjustable document text | Verified in automated environments | Chromium/WebKit and iPad/Mac/Windows/Android native sizing checks passed. |
| AND-01 | Android file-manager Open/Save, cancellation, exact bytes and reopen | Verified on Android 11 emulator | Run 43175083674; permanent signer preserved. Physical Fire HD 8 acceptance pending. |
| REL-052 | Rebuild and publish every existing platform distribution | Verified | iPad/Mac TestFlight 0.5.2 (17), website Mac/Windows/Android 0.5.2; RELEASE-0.5.2.md. |

## Historical acceptance record

[Verification run 43134841430](https://github.com/willyros01/clear-page/actions/runs/43134841430) passed all three jobs on code commit `75a55d599d493a4c3071ef5e438e736b2c51b899`:

- 23 Node tests: parsers, error locations, mixed HTML, Unicode Clang columns, language selection, cancellation, serialization, Save As/manual override, close/save regressions and C indentation.
- Chromium and WebKit: built assets under desktop nonce CSP; actual worker diagnostics, correction/clearing, language overrides/recovery, stale results, manual checks, settings persistence, narrow-screen layout, 36px text and Vim regressions. Screenshots inspected.
- Five Rust tests on each native OS: actual Clang with standard/project headers, additional include paths, macros, missing compiler, invalid macro configuration and malformed C.
- Real Mac and Windows native webviews: JavaScript underlines, error selection, correction, Clang diagnostics in the unsaved buffer, existing editing/layout/Vim tests.
- Mac App Sandbox probe: signed verification executable passed the same native UI tests and a Clang syntax-error check with sandbox entitlements. This is not acceptance of a distributed TestFlight app or arbitrary project/header access.

No physical-device syntax-checking acceptance yet. Existing Windows 0.4.1 acceptance covers indentation, highlighting and Vim only. Native Windows CI used its installed Clang toolchain; the recommended LLVM-MinGW download/setup still needs a clean-machine acceptance check.

## Progress log

| Date | Update | Evidence |
| --- | --- | --- |
| 2026-11-11 | Owner approved optional compiler download/setup; added SYN-13 and its acceptance criteria. | Planning recorded; no downloader or installer implemented or invoked. |
| 2026-11-11 | Implementation and feasibility tasks SYN-01 through SYN-11 verified; release task remains open. | Runs 43133614516, 43134348229 and final 43134841430 passed; final run also passed the Mac sandbox probe. |
| 2026-11-11 | Implementation authorized; added parser workers, diagnostics UI, C adapter/settings and verification workflow. | Local tests pass; native/browser CI pending. |
| 2026-11-11 | Created tracked plan at the owner's request; selected Clang/LLVM as the recommended free desktop C compiler approach. | Planning only; all 12 implementation tasks Pending. |

## Technical references

- [Clang syntax-only checking](https://clang.llvm.org/get_started.html)
- [Apple Command Line Tools](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools)
- [LLVM-MinGW toolchain options](https://www.mingw-w64.org/downloads/)
- [LLVM license and redistribution policy](https://llvm.org/docs/DeveloperPolicy.html)

## Implementation notes

- SYN-01–06: language detection/manual selection, 12pt issue list with jump-to-error, underlines, debounced worker checks, manual checks, stale-result cancellation and size/time limits are implemented. JavaScript/TypeScript/JSON/YAML/HTML/CSS use bundled offline parsers.
- SYN-07–09: C mode/standard and native Clang syntax-only adapter are implemented, with stdin for unsaved text, optional source folder, include directories and macros. Native checks are serialized and bounded; no source files or executables are produced. Five Rust integration tests cover real standard/project headers, macros, invalid code and setup validation. Compiler/project selection is session-only.
- SYN-10: Basic C requires no compiler. Optional desktop Advanced mode uses an existing user-installed compiler. SYN-13 implements the optional Windows path; Mac guided setup remains pending. Mac: Apple Command Line Tools; Windows: LLVM-MinGW. No compiler or SDK is redistributed and no paid signing service is activated. ATE remains proprietary. Bundled JS package licenses are recorded in THIRD-PARTY-NOTICES.txt and included in the app assets.
- SYN-11: TypeScript syntax, bundled offline Python 3.13/Ruff syntax, SQLite SQL grammar and selected Markdown lint are implemented and automated/native verified. Basic structural C is bundled on every platform. None of these checkers executes source. Types, imports/schema existence and full compiler conformance remain outside their documented scope.
- SYN-12: 0.6.0 (19) is built and published across all existing channels. Online/PDF Help, exact hashes and native evidence are updated. Physical acceptance remains outstanding.

## Historical 0.5 release gates (superseded by the 0.6.0 record above)

- [x] Validate the recommended LLVM-MinGW setup on a clean Windows CI runner; physical user-machine acceptance is separate.
- [x] Build/verify the iPhone/iPad package with bundled workers/Wasm and real iPad webview checks. Physical airplane-mode acceptance remains pending.
- [x] Integrate the reviewed feature into the release branch, build installers, sign/notarize Mac and verify exact download checksums.
- [ ] Obtain physical-device acceptance for syntax checking, project headers, large text and Vim. Test the distributed Mac TestFlight edition separately from the website edition.
- [x] Complete 0.5.2 TestFlight and website publication for every existing distribution.
- [ ] Obtain physical acceptance of the distributed builds, including Fire HD 8 file-manager behavior.

iPad/iPhone TestFlight 0.5.0 (15) is uploaded, processed VALID and assigned. No 0.5.0 desktop installer or website publication has been performed.

## Optional compiler download/setup (SYN-13)

Approved product behavior: when an explicit C check cannot find Clang, show a large, readable **Get free C compiler** action alongside **Choose installed compiler** and **Later**. Keep the editor usable without a compiler; never label an unavailable check as successful. Do not download or install automatically at app launch or file open.

- **Mac:** guide the user through Apple's official Command Line Tools setup. The operating system handles installation, licensing and any credentials it requires. Detect the completed install and retry the check only after setup succeeds. Do not rehost Apple's SDK or promise a silent installation. Verify the website and sandboxed TestFlight editions separately.
- **Windows:** offer an optional LLVM-MinGW toolchain download from the official upstream release. Select an appropriate architecture/version, show download size and destination, verify a pinned trusted SHA-256 before extraction/use, retain license notices, and configure ATE to use the selected local compiler. Prefer app-private storage with no system PATH changes or administrator requirement; verify that this packaging approach works before promising it. Never execute partially downloaded or unverified files.
- **Both:** support progress, cancellation, network interruption, retry, insufficient disk space and setup failure. Preserve the document throughout. After setup, verify the compiler identity/version and a simple standard-header fixture before reporting C checking ready.
- Existing compiler detection stays the first option. Downloading is optional; the editor and bundled non-C checkers remain available when the user chooses Later. No paid service or account is part of ATE's compiler setup.

Acceptance evidence must cover missing/existing compilers, a successful official download/setup, wrong checksum, cancellation/interrupted downloads, unsupported platform/architecture, successful re-detection, and C diagnostics after setup. Licensing, download size and exact clean-machine Windows setup are recorded before release.

**Optional Advanced-mode setup status: Windows verified in run 43168469203; Mac guided setup pending.** The separate iPad basic checker is bundled in TestFlight 0.5.0 (15) and needs no compiler setup.

## iPad-first implementation checkpoint

- Owner requested iPad first. Bundle the structural C parser with the app; no optional desktop compiler download/install is offered on iPad. SYN-13 remains a desktop setup task.
- Basic C checks use Tree-sitter C 0.24.1 and web-tree-sitter 0.27.2, both with bundled licenses. Both Wasm assets are included in the app. Missing semicolons/braces, malformed expressions, valid C fixtures and Unicode positions pass local tests. Full header/type/preprocessor/C-standard checks remain exclusive to a real compiler.
- 27 Node tests pass locally. Native iPad worker/Wasm, all seven checkers, error correction/jump, large text, indentation and Vim passed before TestFlight upload (101 checks).
- The release gate verifies archived asset hashes and excludes the simulator-only verification bridge. Website Mac/Windows releases are skipped on `ipad-syntax`; this does not publish a desktop update.
- Status: iPad native verification and TestFlight publication completed. Physical iPad acceptance remains pending.

## iPad 0.5.0 (15) release evidence — 11 November 2026

- Native source: `87c8b940a15ef474d0bb354ff1529135c2301ace`. [Run 43139879836](https://github.com/willyros01/clear-page/actions/runs/43139879836): `editor` and `ipad-native` jobs passed. This run's initial packaging guard had a Python typo; it did not upload a build.
- [Verified packaging run 43141713621](https://github.com/willyros01/clear-page/actions/runs/43141713621) succeeded at source `8d0c931c08c95e5c8a378f9dbdc1793d873ac69f`. It required the passed browser/native jobs, validated all 101 native check assertions and rejected changes to app/dependency/resource source after verification. Only packaging/workflow files changed.
- Production archive verified identity, 0.5.0 (15), icon, privacy manifest, signatures, exact worker/Wasm asset hashes and absence of the simulator test bridge.
- Apple processing: **VALID**. Build ID: `5c151092-9797-4e1a-9aae-51d40dbbd387`. Assignment to the existing internal TestFlight group was verified.
- Simulator screenshot inspected: large C error text, missing-semicolon location, syntax colors and dark appearance. This is simulator evidence; physical-device acceptance is not claimed.
- C on iPad is structural syntax checking only. Headers, macro expansion, types, standard conformance and building/running remain outside that checker. No compiler download is needed on iPad. SYN-13 optional Windows setup is verified; guided Mac setup remains pending.

### Mac TestFlight release

2026-11-11 (America/Toronto): [run 43147595044](https://github.com/willyros01/clear-page/actions/runs/43147595044) passed browser, 27 Node, five Clang/project and native Mac webview checks. The universal distribution app contains arm64 and x86_64 architectures. Apple processed ATE 0.5.0 (16) as VALID (build `59ad98c2-da97-4545-a850-07b24d74c2d4`) and assignment to the existing internal tester group was verified. Physical Mac acceptance remains pending; website downloads were not changed.

## 0.5.2 coordinated rebuild — 12 November 2026
Owner authorized every platform build and publication. Menus, dialogs, Clang settings and compiler setup now use 12pt text (headings max 14pt); document text retains its independent 36px default/adjustment. Android Open/Save use native Storage Access Framework document pickers, preserving cancel/recovery behavior; Android Back behavior retained. Build/test/publication is in progress for iOS, universal Mac TestFlight, signed/notarized Mac website, Windows with optional compiler setup, and permanently signed Android APK. No physical Fire acceptance is claimed from emulator tests.

## 12 November 2026 release checkpoint

ATE **0.6.0 (19)** synchronizes the platform release numbers. iPhone/iPad and universal Mac are VALID/IN_BETA_TESTING; desktop website packages and Android native/signing gates pass. See [RELEASE-0.6.0.md](RELEASE-0.6.0.md) for exact sources, runs, signatures and final public-byte verification. Physical-device acceptance remains separate.
Android native verification: run 43175083674, source `33b071f5510d322e149d2286d5fb1da1866af794`. Public APK SHA-256 `a81ad1c096ce479bfdf56467a8109687e18c456e5da4f8c8d394fd32f45051c9` (4112463 bytes). Cuberoot publisher run 43176173587 verified the live download. Remaining work: physical platform acceptance, Mac guided compiler setup, and separately planned language checkers.

## Zig lightweight compiler assessment — 12 November 2026

| ID | Work | Status | Evidence / remaining work |
| --- | --- | --- | --- |
| SYN-14 | Assess Zig C compatibility and final disk footprint on Windows and both Mac architectures | Assessment verified; integration deferred | Zig 0.17.1 embeds Clang 22.1.8. All 44 adapted direct-frontend fixtures and 21 system-Clang comparisons passed in run 43216011773. Normal zig cc syntax-only failed/timed out; it is not an ATE drop-in. Toolchain allocation roughly 430–459 MB, plus measured driver cache about 50–60 MB; plan 600 MB installed/cache and 1 GB free for fresh setup. Windows allocation is estimated for 4 KB clusters. See assessment/RESULTS.md. |

The assessment changed no application binary or installed compiler. The owner subsequently selected the bundled offline parser as the desktop default (C-DEFAULT below). Zig integration is deferred; no Zig download or adapter is part of this release. This focused suite is not full ISO C conformance certification.

## Desktop offline C default — 0.5.3 (18)

Owner approved implementation on 12 November 2026.

| ID | Work | Status | Evidence / next step |
| --- | --- | --- | --- |
| C-DEFAULT | Reuse bundled offline C parser as desktop default; installed Clang remains optional | Complete; physical acceptance pending | Run 43222957484 passed 30 Node tests, Chromium/WebKit, native Mac/Windows Basic Wasm, zero basic-mode compiler calls, explicit Advanced Clang diagnostics and preference persistence. No default compiler setup/download. |
| REL-053 | Rebuild universal Mac TestFlight/website and Windows website | Complete; physical acceptance pending | Mac 0.5.3 (18) VALID / IN_BETA_TESTING in the existing group. Notarized/stapled universal Mac and Windows 0.5.3 published; publisher 43226821763 verified public hashes/bytes. iOS/Android remain 0.5.2 (17). See RELEASE-0.5.3.md. |

Desktop release 0.5.3 is complete. Online and large-print PDF guides now explain Basic/Advanced mode selection. Remaining device acceptance is tracked separately; no Zig/TinyCC integration or mobile rebuild occurred.

## Website download reporting and location — planned

| ID | Work | Status | Scope / acceptance |
| --- | --- | --- | --- |
| ATE-DOWNLOAD-REPORT | Add ATE Windows, ATE Mac Universal and ATE Android to website click tracking, daily email and download cockpit | Complete — real clicks and test email verified | Separate period/lifetime counts for each platform; retain seven existing categories and reconcile ten-category totals. Record click time/build/browser timezone and show approximate, unverified area in the cockpit with app/date filtering. Extend counter-only Firebase permissions and verify homepage/ATE-page tracking and email rendering. Keep 09:17 America/Toronto, existing cron/Resend and prior-day 09:17-to-current-day 09:17 window. No GPS, app rebuild or fabricated historical counts. |

Owner requested TODO tracking on 12 November 2026. Daily email remains a counts report; timezone-based location details appear in the cockpit. Implementation details and checkboxes: [Cuberoot download reporting TODO](https://github.com/willyros01/Cuberoot/blob/main/docs/APK-COCKPIT.md#ate-download-reporting-and-location--todo-12-november-2026). Editor/parser development remains paused for owner testing.

### ATE-DOWNLOAD-REPORT web portion — 12 November 2026

Owner authorized the web portion. Cuberoot source `4ed43f2ee87faa05b8002a197b8b772d1f21f2c2` is published; browser/activation tests 43282988198 and Pages 43282988027 passed, with live page/module bytes verified. Homepage and ATE-page capture, ten-category cockpit/app/date filters and browser-timezone location display are implemented. Pending ATE public permissions display Setup pending; owner access to an empty collection is not treated as activation. Actual Firebase activation still requires the owner’s authenticated Cloud Shell session using the reviewed Cuberoot `atec.txt` helper. Actual live click recording remains unverified. The seven-app daily email and 09:17 schedule are unchanged; email expansion remains pending. No editor/parser work or app rebuild occurred.

### ATE-DOWNLOAD-REPORT activation verified — 12 November 2026

Owner executed Cuberoot `atec.txt` successfully. Independent public aggregation queries verified all ten categories; ATE Windows, ATE Mac Universal and ATE Android each returned a genuine lifetime count of zero. Firebase activation is complete. Live browser click/timezone-event acceptance remains pending; next step is one real ATE download click followed by cockpit Refresh. Email expansion remains pending and its existing 09:17 Toronto schedule/report are unchanged. No editor/parser changes or app rebuilds occurred.

### ATE-DOWNLOAD-REPORT complete — 12 November 2026

All website/cockpit/Firebase/email items are complete. Live acceptance run 43302545498 at Cuberoot source `3d68a1e5114b8cdac02a92a810b27c434d40dbe8` verified three real downloads, release-file checksums and new anonymous timestamp/build/America-Toronto events: ATE Windows, Mac Universal and Android each 0 → 1 lifetime click. Ten-category plain-text/HTML email and totals passed; the single requested test email was independently found in Gmail Inbox at 15:40:35 Toronto and confirmed by the owner’s screenshot. Subject: Cuberoot Download Clicks - 2026-11-12 (TEST). Morning-cutoff ATE rows correctly show zero; afternoon verification clicks belong to the next daily report. The existing 09:17 Toronto cron job, numeric workflow ID 386014186, daily duplicate protection and sender credentials/recipient were preserved. Corrected legacy preflight 43303064986 passed. See Cuberoot docs/APK-COCKPIT.md for full evidence. Editor/parser development remains paused; no app rebuild occurred.

## iOS tabs — 0.7.0 (20), TestFlight released; physical acceptance pending

- [x] Independent document tabs, unsaved indicators, per-tab in-session undo/selection/scroll/language.
- [x] Save/cancel/discard guards; preserve extensionless names; protect edits during sharing.
- [x] Workspace recovery, legacy migration, 12-tab limit, visible storage-failure warning.
- [x] Chromium/WebKit regression checks.
- [x] iPhone and iPad simulator: all ten parsers, editing/Vim, tabs and process restart.
- [x] Native XCUITest: tab switching, close cancellation, actual Files/Share cancellation, background/rotation/relaunch.
- [x] TestFlight upload after all automated gates pass.
- [ ] Physical iPhone/iPad validation by owner.

Tabs are enabled on iOS only. Current Mac/Windows/Android distributions remain 0.6.0 (19).

Final automated gates: run 43613292921 at source `d23b3ff66fc3555983027a74cf75d01a8c307242` passed 44 Node tests, Chromium/WebKit, 199 native-webview assertions per device, and full XCUITest on both iPhone/iPad. TestFlight is VALID / IN_BETA_TESTING in the existing internal group; Apple build ID `ecae3ae1-3131-411d-90c5-c05caab20d7f`. See IOS-TABS-TEST-PLAN.md for coverage and physical-device limits.

## iOS 0.8.0 (21) — Basic/Advanced, projects and Shell (released; physical feedback recorded)

Owner accepted 0.7.0 (20) after physical testing and authorized this combined update on 14 November 2026.

- [x] Basic/Advanced preference: Basic for new installations, Advanced migration for existing users; preserve work/settings; stop checking in Basic.
- [x] Project creation, folders, text file creation/import, file tree, project save and non-destructive Save As/remove.
- [x] Ordinary Files-accessible project storage, JSON `.ateproj` manifest, portable ZIP import/export; saved-members-only export guard.
- [x] SHA-256 stale-save protection and safe relative paths; filename extensions never appended.
- [x] Shell extensions/startup names/interpreter recognition before embedded Python; shell highlighting and offline POSIX/Bash structural parser; other dialects not falsely checked.
- [x] 53 local Node tests and production build.
- [x] Chromium/WebKit production bundle regression.
- [x] iPhone/iPad native filesystem/mode/project/ZIP/parser/recovery tests.
- [x] Native XCUITest modes, project save/export/remove and all earlier tab/picker regressions.
- [x] TestFlight upload and Apple processing after all gates pass (0.8.0 run 43635811735).
- [ ] Owner physical-device validation of 0.8.0.

Projects/mode controls are enabled on iOS first. Other published distributions remain unchanged.

## Project follow-up — subdirectory Add files control

Requested by owner on 14 November 2026. Status: **Implemented and released in 0.8.2 (23)**.

- [x] When adding files to a project, clearly offer the destination subdirectory, including the project root.
- [x] Preferred interaction: a visible **+ beside each subdirectory** to add files directly into that folder; preselect and clearly display the destination.
- [x] Preserve exact filenames and existing collision/safe-path protections; cancelling must keep the project and open editor unchanged.
- [x] Verify root and nested-folder placement, cancellation and duplicate filenames in regression and native iPhone/iPad functional tests before release.

## Project follow-up — Close project and cohesive page layout

Requested by owner on 14 November 2026. Status: **Implemented and released in 0.8.2 (23)**.

- [x] Add an explicit **Close project** action, distinct from dismissing the Projects page or closing an editor tab. Close the active project workspace without deleting its stored files; protect unsaved project work before closing.
- [x] Redesign the Projects page as a cohesive, readable workflow: clear active-project heading, grouped project actions, folder/file tree, consistent spacing/alignment and accessible touch targets. The owner finds the current layout disjointed.
- [x] Integrate the requested subdirectory destination choice and visible **+ beside each subdirectory** into the folder tree.
- [x] Verify open/close/reopen, unsaved-work protection, ordinary editor tabs, folder add controls and small-screen/large-text layouts through regression and full native iPhone/iPad functional tests.

## iOS 0.8.1 (22) — Save toolbar repair released

ATE **0.8.1 (22)** completed in [run 43651324829](https://github.com/willyros01/clear-page/actions/runs/43651324829) at tested source `bb0d4cbf8c23153393b06c2b24ca5281875619bc`. All 53 Node tests, Chromium/WebKit regression, 270 native WKWebView assertions on each device, three production XCUITest cases per device, and the separate largest-OS-accessibility-text toolbar/Save test on both iPhone and iPad passed before signing/upload. Apple processing is **VALID**, build `2b31ba5a-c8ad-4a90-ba7e-de081a878e48`, and **IN_BETA_TESTING** membership in the existing internal tester group was verified at 18:32 America/Toronto on 14 November 2026. Physical-device acceptance remains pending. See [RELEASE-0.8.1.md](RELEASE-0.8.1.md).

- [x] Narrow-screen Menu/Close/Save row, enlarged-control reflow, wrapped save messages and CSS safe areas.
- [x] Retain independent document font and text/icon preferences.
- [x] All regression/native functional gates, including actual largest OS text setting on both device types.
- [x] Signed upload, Apple processing and existing internal tester assignment.
- [ ] Owner physical iPhone/iPad validation at preferred text/display settings.

The project follow-up items above were subsequently implemented and released in 0.8.2 (23); see the verified result below.

## Owner feedback — iPhone menu, filenames and SQL files

Reported against TestFlight 0.8.1 (22). Status: **Implemented and released in 0.8.2 (23)**. The owner resumed and authorized all fixes in this build.

- [x] **iPhone layout after leaving Menu:** reproduce the screen shifting after filename/settings input and returning to the editor, including Export copy cancellation with the software keyboard visible. The toolbar overlaps the status bar and Save/message content can extend beyond the right edge. Verify menu exit, keyboard show/hide, icon/text buttons, preferred large text/display zoom and orientation; keep the toolbar and editor within the visible screen.
- [x] **File name field clarity:** add a persistent visible “File name” label, a contrasting field background and clear border, and place the field with the file controls. The current field (shown with “Qzzzzzzz”) looks like the background and can be mistaken for document text. Preserve the exact filename; ensure an empty filename still has a meaningful visible label/tab fallback.
- [x] **General syntax-checking information:** replace the mobile “About C checks” entry with “About syntax checking” covering all supported checkers: JavaScript, TypeScript, JSON, HTML, CSS, YAML, C, Python, Shell scripts, SQL and Markdown. Describe each checker's scope and limits; retain C-specific compiler details only where relevant.
- [x] **SQL file selection/editing:** removed restrictive iOS provider-type filtering from ordinary Open and project Add files. Automated checks passed for UTF-8 validation, exact .sql names, SQL detection/checking, editing and save payloads. Native Files picker/cancellation passed. Physical SQL selection and successful Save to Files/reopening in each provider remain owner acceptance items below.
- [x] **Project tree bottom row:** keep root and nested file boxes aligned on both edges and make the last file/Remove row fully reachable without clipping. Include the reported iPad landscape layout, long filenames, scrolling and large text. This joins the pending folder + / destination, Close project and cohesive Projects-page work.

Regression and full native iPhone/iPad functional coverage passed before release. Physical-device and individual Files-provider acceptance remain separate from simulator results.


## iOS 0.8.2 (23) — implementation completed

Owner resumed this build on 15 November 2026. Includes project destination/+ controls, guarded Close project, cohesive single-scroll Projects page and aligned root/nested bottom rows; iPhone visual-viewport/menu return repair; a labelled contrasting filename field, Open files label and filename/content separation; general syntax-checker help; and unrestricted iOS file selection followed by strict text-byte validation so SQL/provider UTIs are selectable. Regression coverage includes SQL open/edit/save, metadata isolation, viewport changes, project save/cancel/discard/stale saves and enlarged layouts. Native iPhone/iPad and largest-OS-text gates passed before TestFlight. Physical Files-provider acceptance remains for owner testing. Previous stopped/pending statuses are superseded by this authorized work; the verified release result below records completion.


## Verified iOS 0.8.2 (23) result — 15 November 2026

ATE **0.8.2 (23)** is released to the existing internal TestFlight group. [Run 43684792345](https://github.com/willyros01/clear-page/actions/runs/43684792345) passed at tested source `93645a4cf237e7e615efeb3a19d052c8b3410919`. All 54 Node tests, Chromium/WebKit production regression, 291 native WKWebView assertions per device, all six production XCUITest cases per device, and both separate largest-OS-accessibility-text cases per device passed before archive/sign/upload. Apple processing is **VALID**, build `5e53acda-97ff-4272-8f44-f3768f9dfc9d`; existing-group **IN_BETA_TESTING** was verified at 01:59 America/Toronto on 15 November 2026 (06:59 UTC). Physical iPhone/iPad and individual Files-provider acceptance remain pending.

- [x] iPhone menu/keyboard/export-return alignment and responsive Save controls, including magnified narrow visual viewports.
- [x] Contrasting File name card, explicit label/hint, Open files label, filename/content isolation and Untitled fallback.
- [x] General syntax-checker reference and unrestricted SQL/extensionless file selection followed by strict text validation.
- [x] Folder/root + controls with captured destination, cohesive project page, aligned root/nested rows and reachable final Remove button.
- [x] Close project with Cancel/Save/Discard, stale-save protection and ordinary/other-project tab preservation.
- [x] All automated gates, signed upload, Apple processing and internal tester assignment.
- [ ] Owner physical-device acceptance, especially preferred iPhone text/display settings and SQL selection from each Files provider.


## iOS 0.8.3 (24) — approved Projects redesign, TestFlight released

Owner approved the reviewed mockup on 15 November 2026. The tree is the primary view: folder names select, arrows expand/collapse, filenames open an editor tab. Clear Open project / Close project controls; Open project also offers Create new project, ZIP import/export and secondary membership management. The selected-folder action bar offers Add file (Create file / Choose files), New folder and Delete folder; destination remains explicit. No scattered + buttons, Your projects section, always-visible filename/path form or per-file Remove boxes in the main tree. Projects uses larger 20px controls, 22px tablet/20px phone file labels, 24–28px headings and a compact 20px phone header; document font remains independent.

Folder deletion previews all contents (including unlisted on-disk files), refuses project root or unsaved affected tabs, detects changed contents before confirmation, stages the directory by rename, commits membership removal and rolls back on write failure before cleaning the staged directory. Clean affected tabs close only after successful deletion; other tabs, sibling folders, outside originals and other projects remain. Failed cleanup leaves a recovery copy and reports it. Regression and full iPhone/iPad native suites, plus largest-text checks, must pass before TestFlight upload. No change to the editor’s existing Close/Exit behavior is included in this Projects build. Physical-device acceptance follows TestFlight availability.


## Verified iOS 0.8.3 (24) release — 15 November 2026

ATE **0.8.3 (24)** is released to the existing internal TestFlight group. [Run 43719685778](https://github.com/willyros01/clear-page/actions/runs/43719685778) passed at tested source `b4eee097274214c87afd133566de44435d354bb8`. All **59 Node tests**, Chromium/WebKit production regression, **286 native WKWebView assertions per device**, the focused production Projects case, **all six full functional XCUITest cases per device**, and **both largest-OS-accessibility-text cases per device** passed before archive/sign/upload. Apple processing is **VALID**, build `f496fa71-3eb5-4361-850c-ddd63904427c`; existing-group **IN_BETA_TESTING** was verified at **09:24 America/Toronto on 15 November 2026** (14:24 UTC). Physical iPhone/iPad and individual Files-provider acceptance remain pending. See [RELEASE-0.8.3.md](RELEASE-0.8.3.md).

The WebKit dialog-return blocker is resolved by showing one Projects modal at a time. Syntax-worker startup has a separate 30-second initialization budget while parsing retains its eight-second post-readiness watchdog. Native timeouts remain failures; no test gate was bypassed. Existing editor Close/Exit behavior and the independent 36px document default are preserved.


## Verified desktop/web 0.8.3 (24) publication — 15 November 2026

Mac TestFlight is VALID / IN_BETA_TESTING (Apple build `baa2893b-a90b-4785-9785-091735c21119`). Signed/notarized/stapled universal Mac and the exact tested Windows installer are live on Cuberoot with public hashes verified; the web app and all public assets passed live browser/hash checks. Native desktop source `f52d12ec97793e34c3b2471509b0d0094d6ae9b7` was preserved through artifact release 43734007478 rather than rebuilt. Android failures are handled by the independent `android-083.yml` workflow on `android`, with no further desktop cancellation/rebuild. The earlier requirement to hold all platform publication for Android was superseded by the owner's direction to publish the successful Mac/Windows builds. APK verification remains in progress; physical-device acceptance is not claimed. See [RELEASE-0.8.3-PLATFORMS.md](RELEASE-0.8.3-PLATFORMS.md).
