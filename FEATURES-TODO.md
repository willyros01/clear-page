# ATE features to-do list

Recorded: 15 November 2026 (America/Toronto).

These previously discussed features remain planned. Priority order is preserved below. Implementation and release require separate tracking; this list does not mark any feature complete.

- [ ] **FEAT-01 — Backup copies:** optionally keep earlier saved versions so they can be recovered.
- [ ] **FEAT-02 — Compare changes before saving:** show changes since the file was opened and clearly identify unsaved changes.
- [ ] **FEAT-03 — Function outline and navigation:** jump directly to functions and code sections, including brace navigation.
- [ ] **FEAT-04 — Search across a project:** find text across project files. Cross-file replacement is a later extension.
- [ ] **FEAT-05 — Optional code formatting:** tidy indentation and layout, with a preview before applying changes.
- [ ] **FEAT-06 — Additional reading controls:** stronger contrast, adjustable line spacing and a more visible cursor.

Tabs, Basic/Advanced mode, Projects and expanded syntax checking are already implemented and are not remaining feature items.

Added 22 November 2026 (owner approved, release 0.8.8 (29)): HTML/Markdown Preview; Java syntax checking; XML, TOML and INI checks; colours for C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, PowerShell and Lua. These are implemented in 0.8.8; release status is tracked in CHANGELOG.md and TODO.md, and physical-device acceptance is recorded separately.

Before releasing each feature, complete relevant regression and full functional checks, including native simulator/emulator coverage for affected mobile platforms. Record automated verification separately from physical-device acceptance.
