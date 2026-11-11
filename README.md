# Clear Page

An accessible full-screen text and code editor, version 0.2.1.

## Build and run
Use Node.js 22 or newer. Run `npm ci`, `npm test`, then `npm run build`. Serve the generated `dist/` directory using a static web server. Dependencies are bundled locally; the editor does not load CodeMirror from a CDN.

## Editing
Choose Plain text, JavaScript, HTML, CSS, or Python. Supported filename extensions select the language when the filename field loses focus. CodeMirror provides syntax highlighting, four-space automatic indentation, line numbers, bracket matching, undo/redo, and search (Ctrl/Cmd+F).

Use Indent/Unindent buttons or Tab/Shift+Tab. Press Escape then Tab to move keyboard focus out of the editor. Use A−/A+ for 24–72px text (36px default), Light/Dark, and Full screen.

Open imports a text file. Save file downloads a copy; it does not overwrite the source file. Draft recovery stays in this browser on this device, and preserves drafts from version 0.1.0. Clearing browser data removes drafts.

## Verification
Build and automated language/indentation checks pass. Desktop Chrome checks verified JavaScript/Python automatic indentation, syntax colors, indent controls, text sizing, dark mode, draft recovery after reload, and full-screen mode. Physical iPad testing and native builds remain pending.

See ROADMAP.md for the platform plan.

## Compact toolbar and exit
Menu contains file, language, appearance, indentation and full-screen controls. Exit offers Keep editing, Save and exit, and Exit without saving. The latter clears the browser draft and shows Editor closed; existing device files are unaffected. Save and exit starts a download and retains a recovery draft because browsers cannot confirm that a user completed saving. The web app cannot close a user-opened browser tab; close it after the Editor closed screen.

0.2.1 browser checks passed for the compact layout, menu, exit cancellation, draft discard followed by reload, save-and-exit download initiation, and restarting editing. iPad device acceptance remains pending.
