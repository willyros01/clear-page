# Clear Page

An accessible full-screen text and code editor, version 0.2.0.

## Build and run
Use Node.js 22 or newer. Run `npm ci`, `npm test`, then `npm run build`. Serve the generated `dist/` directory using a static web server. Dependencies are bundled locally; the editor does not load CodeMirror from a CDN.

## Editing
Choose Plain text, JavaScript, HTML, CSS, or Python. Supported filename extensions select the language when the filename field loses focus. CodeMirror provides syntax highlighting, four-space automatic indentation, line numbers, bracket matching, undo/redo, and search (Ctrl/Cmd+F).

Use Indent/Unindent buttons or Tab/Shift+Tab. Press Escape then Tab to move keyboard focus out of the editor. Use A−/A+ for 24–72px text (36px default), Light/Dark, and Full screen.

Open imports a text file. Save file downloads a copy; it does not overwrite the source file. Draft recovery stays in this browser on this device, and preserves drafts from version 0.1.0. Clearing browser data removes drafts.

## Verification
Build and automated language/indentation checks pass. Desktop Chrome checks verified JavaScript/Python automatic indentation, syntax colors, indent controls, text sizing, dark mode, draft recovery after reload, and full-screen mode. Physical iPad testing and native builds remain pending.

See ROADMAP.md for the platform plan.
