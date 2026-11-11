# Clear Page

An accessible full-screen text and code editor, version 0.3.1.

## Build and run
Use Node.js 22 or newer. Run `npm ci`, `npm test`, then `npm run build`. Serve the generated `dist/` directory using a static web server. Dependencies are bundled locally; the editor does not load CodeMirror from a CDN.

## Editing
Choose Plain text, JavaScript, HTML, CSS, or Python. Supported filename extensions select the language when the filename field loses focus. CodeMirror provides syntax highlighting, four-space automatic indentation, line numbers, bracket matching, undo/redo, and search (Ctrl/Cmd+F).

Use Indent/Unindent buttons or Tab/Shift+Tab. Press Escape then Tab to move keyboard focus out of the editor. Use A−/A+ for 10–54pt text (27pt / 36px default), Light/Dark, and Full screen.

Open imports a text file. Save file downloads a copy; it does not overwrite the source file. Draft recovery stays in this browser on this device, and preserves drafts from version 0.1.0. Clearing browser data removes drafts.

## Verification
Build and automated language/indentation checks pass. Desktop Chrome checks verified JavaScript/Python automatic indentation, syntax colors, indent controls, text sizing, dark mode, draft recovery after reload, and full-screen mode. Physical iPad testing and native builds remain pending.

See ROADMAP.md for the platform plan.

## Compact toolbar and exit
Menu contains file, language, appearance, indentation and full-screen controls. Exit offers Keep editing, Save and exit, and Exit without saving. The latter clears the browser draft and shows Editor closed; existing device files are unaffected. Save and exit starts a download and retains a recovery draft because browsers cannot confirm that a user completed saving. The web app cannot close a user-opened browser tab; close it after the Editor closed screen.

0.2.1 browser checks passed for the compact layout, menu, exit cancellation, draft discard followed by reload, save-and-exit download initiation, and restarting editing. iPad device acceptance remains pending.

## Button style and text size
In Menu, choose Buttons → Text or Icons. Icons retain accessible names and hover labels. Exit confirmation choices keep explicit text. Enter a Text size from 10 to 54 points, or use A−/A+ in one-point steps. These settings persist independently of drafts, including after exiting without saving. Existing pixel-based drafts migrate to the equivalent point size.

0.2.2 browser checks passed for both button styles, 10pt rendered at 13.333px, disabled decrease at the minimum, one-point adjustment, and preference persistence after reload.

## Search, Copy, Vim and online Help
Menu now includes Search / Replace, Go to line, Select all, Copy, and Help. Search supports case sensitivity, whole words and regular expressions. Replacement can affect one match or all matches. Use Undo to revert replacement. Copy places selected text in the device clipboard; when clipboard access fails, a manual-copy window appears.

Editing → Vim enables optional Vim key bindings; Standard remains the default. Esc returns to normal mode, i inserts, / searches, : starts an Ex command, :25 jumps to a line, and :%s/old/new/g replaces across the document. :w downloads, :q opens the exit choices, and :wq starts a download and exits. Vim yanks use an internal register; Copy uses the system clipboard.

Menu → Help is the bundled online user guide, with topic links and command tables in large text. Browser checks verified Replace all, system clipboard content, Vim substitution and quit, returning to Standard mode, Help content, and go-to-line. Physical-device acceptance remains pending.

0.3.1 fixes Vim command-input contrast and width, including explicit WebKit text-fill colors. Visual confirmation on iPad remains pending.

## Desktop 0.4.1 verification — 11 November 2026
The desktop repair passes Tauri's style nonce to CodeMirror. Without it, Tauri's strict policy rejected the generated styles and the editor lost its whitespace, layout, syntax colors and readable Vim controls.

Run `npm ci`, `npm test`, `npm run build`, `npx playwright install --with-deps chromium webkit`, then `npm run test:browser`. The browser checks use built assets and a nonce policy matching the desktop policy. Native CI builds with `--features editor-verification` and checks the actual Mac/Windows webviews before rebuilding distribution binaries without that feature. The test bridge is excluded from distributed builds.

Run 43087543526 passed both browser engines and both native webviews, including 36px text, monospaced layout, preserved spaces, JavaScript highlighting, Enter/Tab/Shift-Tab indentation, Vim delete/undo/substitution/go-to-line and dark appearance. Run 43087885350 downloaded the exact public 0.4.0 Windows installer, verified SHA-256, installed and launched it on Windows. This does not resolve the user's device-specific rejection or establish interactive browser/SmartScreen acceptance; request the exact message and downloaded filename. No physical-device acceptance is claimed.
