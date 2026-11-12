# Changelog

## Unreleased — automatic language detection
- Detect supported languages from filename first, then a bounded local content scan for C, JavaScript, TypeScript, JSON, HTML, CSS, YAML, Python, SQL and Markdown; ambiguous content remains plain text.
- Recognize source filenames ending in .txt without renaming them; re-detect restored automatic drafts instead of retaining a stale plain-text mode. Explicit manual selection survives recovery, filename edits and Save As.
- Detection never writes or renames a source file. The reported unsolicited .txt suffix remains unresolved; native reproduction and release verification are pending.

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

