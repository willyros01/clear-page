# Clear Page development instructions

- Preserve the default 36px editor text and adjustable document sizing. The owner specified 12pt menu/configuration/control text (14pt maximum for headings) on 12 November 2026; retain touch targets of at least 44px.
- Owner approved on 15 November 2026 (evening, superseding the larger Projects sizes approved earlier that day): Projects uses the same sizes as the Menu — 12pt (16px) controls and 14pt headings — and keeps its full folder tree. The editing screen uses one top row (Menu, tabs, Exit, Save), the full "Opened …" message in a slim bottom line, and hides that line while the on-screen keyboard is up. Keep the independent 36px editor default and 44px touch targets.
- Work in small steps and report completed work, checks, and remaining limitations accurately.
- Keep shared editor behavior in one codebase, with thin platform adapters for file handling and native features.
- Planned editor: CodeMirror. Planned mobile shells: Capacitor. Planned desktop shells: Tauri.
- Never commit credentials, signing keys, user documents, or draft contents.
- Test meaningful behavior before publishing. Do not claim native or device acceptance from browser tests.
- Keep ROADMAP.md and CHANGELOG.md current.
