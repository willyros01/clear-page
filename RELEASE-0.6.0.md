# ATE 0.6.0 (19) — verification in progress

All platform packages use release.json (0.6.0, build 19). Native/package/public download verification must complete before this document claims a released binary.

## Changes
- Preserve explicit and extensionless filenames on Save. Discard has no file-write path. Android uses a MIME type with no registered extension to avoid file-provider text suffixes. The owner could not reproduce the earlier unsaved suffix report; that cause remains unconfirmed.
- Detect supported languages by filename, then a 32K-character local content sample; respect manual overrides and correct stale automatic recovery modes. Detection does not rename documents.
- Python: bundled Ruff 0.6.9 Wasm parser, target Python 3.13, syntax only. It does not execute code, resolve imports, check names/types, or promise CPython compilation equivalence.
- SQL: bundled node-sql-parser 5.4.0, SQLite grammar only. No SQL is executed; schema existence and other dialects are outside this check.
- Markdown: Lezer Markdown parser with warnings for duplicate headings, unclosed fenced code and trailing whitespace. Two-space hard line breaks are allowed. This is selected linting, not a complete markdownlint rule set.
- Retain JS/TS/JSON/YAML/HTML/CSS offline parsers and compiler-free Basic C on all platforms. Optional desktop Clang remains available.

## Evidence
- 40 Node tests pass, covering parser behavior, UTF-16 positions, Save filename preservation, recovery/manual modes, cancellation and discard.
- Shared production bundle builds locally. Python Wasm is bundled (about 8 MB; exact artifact hashes recorded after CI), with no network installation on the device.
- Coordinated workflow includes Chromium/WebKit, native Mac/Windows/iPad workers, Android 11 document-provider and extensionless save tests, release signatures and Apple processing/group assignment.
- Native workflow run, exact package hashes, public download verification and Apple build IDs: pending.
- Physical Windows, Mac, iPad and Fire HD 8 acceptance remains separate.

## Compatibility correction
The first Android 11 gate rejected the modern Ruff 0.17.5 Wasm reference types (invalid local type). No package from that attempt was published. Pin the Ruff 0.6.9 MVP-compatible Wasm build on every platform, target Python 3.13, and map its Unicode scalar columns to editor UTF-16 offsets. Rerun all gates on the corrected common source.
