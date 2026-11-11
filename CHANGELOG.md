# Changelog

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
