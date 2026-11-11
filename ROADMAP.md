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
Signed release workflow is implemented and running. Release-resource packaging and archive checks now run before distribution signing. Apple processing and physical-device acceptance must be verified; see IOS-SETUP.md for the latest result.
