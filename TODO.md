# ATE syntax checking TODO

Last updated: 2026-11-11 (America/Toronto).

## Progress

Planning recorded. Implementation has not started: **0 of 12 tasks complete**.

Statuses: Pending → In progress → Implemented → Verified. Use Blocked when a dependency prevents work. Mark a task Verified only with evidence; automated checks and physical-device acceptance must be recorded separately. Update this table and the progress log with each change.

## Scope and decisions

- Add code checking based on document language, distinct from syntax highlighting and indentation already available in several modes.
- Initial target: JavaScript, JSON, HTML, CSS, YAML and C. Additional candidates: TypeScript, Python, SQL and Markdown.
- C desktop recommendation: Clang/LLVM; Apple Command Line Tools on Mac, LLVM-MinGW on Windows. Tools are free. Compiler integration, packaging and licensing review remain pending.
- Keep ATE proprietary. Retain required third-party licenses/notices; do not change ATE's license.
- Prefer local/offline checking. Do not execute user programs as part of checking or upload document contents.
- Keep shared editor behavior with thin native adapters. Preserve 36px default text, adjustable sizing, themes and Vim behavior.
- This document authorizes planning/tracking only; it does not claim these features exist or start compiler installation, application builds or publication.

## Tracked tasks

| ID | Work | Status | Completion evidence / next step |
| --- | --- | --- | --- |
| SYN-01 | Detect language from extension and provide a manual selector for new/ambiguous files. | Pending | Define supported extensions and override behavior; verify open, new and Save As. |
| SYN-02 | Add readable error underlines, line/column messages, error list and jump-to-error. | Pending | Verify large text, keyboard/touch, light/dark themes and Vim coexistence. |
| SYN-03 | Add Check Syntax command and debounced checks while typing. | Pending | Cancel/ignore stale results; handle large files and unavailable checkers; never run user code. |
| SYN-04 | Implement JavaScript and JSON checking. | Pending | Select parsers; verify valid/invalid fixtures, modern JS and precise error positions. |
| SYN-05 | Implement HTML and CSS checking. | Pending | Select validators; define error/warning scope, including mixed-language documents. |
| SYN-06 | Implement YAML checking. | Pending | Select parser; verify indentation/structure errors and useful diagnostics. |
| SYN-07 | Add C highlighting, indentation and C-standard selection. | Pending | Verify .c/.h language selection, comments, strings, preprocessor and Vim editing. |
| SYN-08 | Integrate desktop Clang syntax-only checking on Mac and Windows. | Pending | Use -fsyntax-only; map diagnostics to the current unsaved buffer; verify both native platforms. |
| SYN-09 | Support C headers, include paths, macros and project compiler settings. | Pending | Verify standard headers and a multi-file project; distinguish missing setup from code errors. |
| SYN-10 | Decide compiler setup/distribution and document licenses. | Pending | Evaluate detecting existing tools versus optional bundling; include all required headers/libraries/notices and assess download size. No paid services. |
| SYN-11 | Assess TypeScript, Python, SQL, Markdown and iPad C checking. | Pending | Record a suitable checker and limitations per language/platform. SQL needs a dialect; Markdown checks are linting. iPad C requires a separate feasibility decision. |
| SYN-12 | Verify, document and release approved changes across platforms. | Pending | Record automated results, native Mac/Windows checks and physical acceptance separately; update Help, ROADMAP and CHANGELOG before publication. |

## Acceptance record

No syntax-checking implementation or acceptance evidence yet. Existing Windows 0.4.1 acceptance covers indentation, highlighting and Vim only; it does not establish syntax checking.

## Progress log

| Date | Update | Evidence |
| --- | --- | --- |
| 2026-11-11 | Created tracked plan at the owner's request; selected Clang/LLVM as the recommended free desktop C compiler approach. | Planning only; all 12 implementation tasks Pending. |

## Technical references

- [Clang syntax-only checking](https://clang.llvm.org/get_started.html)
- [Apple Command Line Tools](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools)
- [LLVM-MinGW toolchain options](https://www.mingw-w64.org/downloads/)
- [LLVM license and redistribution policy](https://llvm.org/docs/DeveloperPolicy.html)
