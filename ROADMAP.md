# Clear Page development roadmap

Work in small, reviewable steps. Keep one shared editor for all platforms.

## Step 1 — Baseline
- Preserve the original standalone HTML/CSS/JavaScript editor as index.html.
- Current capabilities: 36px default text, 24–72px adjustment, light/dark appearance, focus/full-screen mode, text-file import/download, local browser draft recovery, word/character counts.
- Version 0.1.0 preserved the textarea baseline in Git history; 0.2.0 now uses CodeMirror.
- Drafts are local to a browser and device; they are not cloud backups.
- The existing ChatGPT-hosted version remains the current live preview. GitHub does not automatically deploy this repository yet.

## Step 2 — Shared code editor (implemented in 0.2.0; iPad acceptance pending)
Integrate CodeMirror with bundled dependencies, syntax highlighting, automatic indentation, line numbers, bracket matching, undo/redo, find/replace, and indent/unindent commands. Start with plain text, JavaScript, HTML, CSS, and Python. Preserve large text and accessible controls.

## Step 3 — Reliable files and web acceptance
Implement platform-aware Open, Save and Save As; protect unsaved work; verify draft recovery and offline operation. Test iPad touch and external keyboard behavior. Obtain device acceptance before platform packaging.

## Step 4 — Mobile
Package the shared editor using Capacitor for iOS/iPadOS and Android. Add native file adapters, CI builds, signing, and physical-device acceptance. Distribute through TestFlight/App Store review and Android APK downloads on Cuberoot.

## Step 5 — Desktop
Package the shared editor using Tauri for Windows and macOS. Add desktop file adapters and shortcuts, CI builds, signing and macOS notarization. Test installers on each OS before Cuberoot distribution.

## Verification record
Baseline JavaScript syntax check passes. Earlier browser checks verified typing, font adjustment, recovery after refresh, and full-screen mode. Native packages and offline installation have not yet been built or verified.

## 0.2.1 usability update
Compact toolbar and explicit exit choices implemented and browser checked. iPad acceptance pending.

## 0.2.2 usability update
Switchable text/icon controls and editor text sizes down to 10pt implemented and browser checked.

## 0.3.0 editing tools
Search/replace, Go to line, Select all/Copy, optional Vim and online Help implemented and browser checked. Physical iPad acceptance pending.

## 0.3.1 Vim command visibility
Explicit command-input contrast and sizing applied. Build/automated checks pass; browser preview was access-blocked, and iPad visual acceptance is pending.

## iOS build checkpoint
Capacitor shell and simulator workflow implemented on ios branch. See IOS-SETUP.md for release gates. Signed TestFlight distribution remains pending.

## Apple access checkpoint
Apple app registration and all four repository signing secret entries are configured. A read-only Apple API preflight is now available. Signing/export/upload and release-resource integration remain pending; see IOS-SETUP.md.

## First TestFlight release
Clear Page 0.3.1 (1) is signed, uploaded and processed by Apple (VALID). Release-resource packaging and archive checks passed. Next: tester assignment and physical iPad/iPhone acceptance; see IOS-SETUP.md for evidence.

## Internal tester access enabled
Clear Page Internal now contains the verified account holder and build 0.3.1 (1). Apple reports IN_BETA_TESTING. Invitation acceptance and physical-device acceptance remain pending.

## ATE 0.3.2
Product is now Another Text Editor (ATE). Approved minimalist writing icon and direct document-close behavior are implemented. Automated close/recovery checks and simulator launch pass. ATE 0.3.2 (3) is processed and assigned to the internal tester. Physical iPad acceptance is next.

## 0.4.0 coordinated Apple/desktop release
Implemented on `desktop`: shared editor with a Tauri desktop adapter, Windows installer, universal Mac build, iPad TestFlight job and Mac website/TestFlight export jobs. Existing mobile release branches are preserved. See DESKTOP-SETUP.md for signing gates and pending native acceptance. No Mac or Windows public download is claimed before its artifact is verified.

## Desktop regression, 11 November 2026
Mac 0.4.0 device feedback exposed missing CodeMirror styles and unreliable Vim. Launch-only checks did not establish editor usability. Version 0.4.1 passes the bundled style nonce into CodeMirror and requires browser behavior tests plus native webview checks before packaging. Physical Mac/Windows acceptance remains required. Investigate the Windows download rejection with the exact Windows message; the current public file is a valid installer with a matching checksum.

Verification update: run 43087543526 passed Chromium, WebKit and actual native Mac/Windows editor behavior; both native installer builds and launches passed. Public-download run 43087885350 passed Windows download/checksum/executable recognition/install/launch. Final signing/upload and publication are tracked by release run 43088542493. Device acceptance and the exact Windows rejection remain outstanding.

## Windows signing preparation
The user rejected Store distribution and approved trying verified code signing for direct Cuberoot downloads. The manual signing workflow and Tauri signing hook are prepared; no billable resources have been created. Real signing and publication await the owner's Azure account and Public Trust identity validation. See WINDOWS-SIGNING.md. Signing does not guarantee immediate SmartScreen reputation.

Final Windows decision: the owner declined paid signing after reviewing Basic at US$9.99/month. The unsubmitted Azure form was closed and zero signing accounts were confirmed. Keep code proprietary and direct downloads available. The owner subsequently completed the Windows download using Keep and confirmed editor functionality.

Mac 0.4.1 website recovery: Apple accepted notarization 06073ae2-3718-46f1-a9c2-9866b9606821. Recovery run 43103034568 verified the exact submitted disk image hash, stapled and validated the ticket, checked Developer ID/team/bundle ID, verified Intel/Apple silicon architectures and passed Gatekeeper. Publication is proceeding through the verified Cuberoot installer pipeline.

## Planned syntax checking
See [TODO.md](TODO.md) for language-aware syntax checking, free Clang/LLVM integration for C on Mac/Windows, platform limitations and task-by-task progress. Planning recorded on 11 November 2026; implementation not started (0/12 complete).

## Syntax checking implementation — 0.5.0
Implementation is on `syntax-checking`: shared parser workers and readable diagnostics, C Clang adapter/settings, additional language modes and bundled license notices. See TODO.md for per-task progress and remaining browser/native/device acceptance. Production downloads remain 0.4.1 pending verification.

Verification checkpoint: SYN-01–11 are verified at the scope recorded in TODO.md. Final run 43134841430 passed Chromium/WebKit, native Mac/Windows and a Mac sandbox probe. Implementation is in PR #1; 0.5.0 packaging, physical acceptance and publication remain outstanding.

## Optional C compiler setup approved
SYN-13 in TODO.md tracks an optional missing-compiler offer: official Apple Command Line Tools setup on Mac, or a verified official LLVM-MinGW download on Windows. Keep Later and Choose installed compiler options; no automatic install at launch. This is planned, not implemented.

## iPad-first syntax checking
The owner prioritized iPad. `ipad-syntax` bundles a basic C parser alongside the six existing parser-based checkers, adds a simulator native-worker/diagnostics gate, and uploads to TestFlight only after verification. Full compiler setup/download stays a desktop feature; the iPad UI explains its basic checker limits.

## iPad TestFlight 0.5.0 (15) complete
27 Node tests, Chromium/WebKit and 101 native iPad webview checks passed. The production archive verified its bundled C Wasm/worker assets and excluded the simulator test bridge. Apple processing is VALID and the build is assigned to the existing internal tester group. Packaging run 43141713621 reused the exact app source verified in native run 43139879836 after a packaging-script-only fix. Physical iPad acceptance remains pending; desktop website downloads remain 0.4.1. See TODO.md for evidence and remaining gates.

## Mac TestFlight 0.5.0
Mac-only release workflow verifies browser behavior, local Clang integration and the native Mac webview before universal distribution signing/upload. Universal Mac 0.5.0 (16) completed in run 43147595044: automated browser/compiler/native checks passed, Apple processing VALID, and existing internal tester assignment verified. Physical Mac acceptance remains pending.

## Windows 0.5.1 optional compiler
Implementing and verifying the approved optional LLVM-MinGW setup for Windows website distribution. Pinned release 20261104 (191,037,046 bytes), app-private install, retained upstream licenses, 3 GB free-space requirement, no admin/PATH change. Native/installer/publication results remain pending until CI completes. Mac/iPad 0.5.0 TestFlight builds are separate releases.

## 0.5.2 — common control sizing and Android document pickers
- Set shared menus/configuration/control text to 12pt, headings maximum 14pt; preserve document font preferences and touch targets.
- Android/Fire Open and Save now use native system file-manager intents instead of the iOS share sheet. Native cancellation preserves the recovery draft.
- Retain syntax checks and Windows optional verified Clang installation. All-platform verification, signing, TestFlight and website distribution are in progress.

## Current release — 0.5.2, 12 November 2026

ATE **0.5.2 (17)** is processed VALID and assigned to the existing internal TestFlight groups for iPhone/iPad and universal Mac. Verified 0.5.2 Mac, Windows and Android downloads are published on Cuberoot. See [RELEASE-0.5.2.md](RELEASE-0.5.2.md) for exact build sources, native test runs, signatures and public-download hashes. Physical-device acceptance remains separate.
All native control-sizing and editor gates passed. Android 11 native verification additionally covered the system document pickers, cancellation, saving exact UTF-8 bytes and reopening. Source branches share the approved editor and thin native adapters. See TODO.md for remaining physical acceptance and Mac guided compiler setup.

## TestFlight visibility audit
12 November 2026: read-only run 43211972237 confirmed both iOS and Mac 0.5.2 (17) are IN_BETA_TESTING, VALID, unexpired and assigned to the existing installed tester. Notification delivery and device UI visibility were not verified. Added a read-only availability workflow for future checks; no binaries rebuilt or tester recipients changed.

## Lightweight compiler assessment — Zig 0.17.1

Native Windows x64, Intel Mac and Apple silicon assessment completed in run 43216011773. Zig embeds Clang 22.1.8; adapted direct syntax-check invocation passed 44 focused fixtures. The ordinary zig cc driver failed/timed out with ATE's syntax-only path. Final toolchain allocation is about 430–459 MB (Windows estimated), with 600 MB a practical toolchain/test-cache allowance and 1 GB free for fresh installation. No application integration or binary release occurred. See assessment/RESULTS.md and SYN-14 in TODO.md.
