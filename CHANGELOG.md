# Changelog

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
