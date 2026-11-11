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
